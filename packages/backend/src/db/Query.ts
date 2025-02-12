import type { JSONValue, SqlQuerySpec } from "@azure/cosmos";

type Op = "<" | "<=" | "=" | ">" | ">=" | "CONTAINS";

export type Condition = [field: string, op: Op, value: JSONValue];
export type Where = [clause: string, parameters?: Record<string, JSONValue>];

/**
 * Helper class for building SQL queries
 *
 * When adding WHERE clauses to the QueryBuilder, order them for the best performance.
 * CosmosDB processes WHERE conditions sequentially, so placing the most efficient and selective filters first
 * reduces the number of documents scanned, improving query speed and lowering RU costs.
 *
 * Add WHERE clauses in this order:
 *
 * 1. Equality filters
 *     - Eliminates the most documents with a single indexed lookup.
 *     - Example: c.x = 10
 *
 * 2. Range filters
 *     - Efficient but requires index scans
 *     - Example: c.x > 10
 *
 * 3. Array item equality checks
 *     - Uses index but scans arrays
 *     - Example: ARRAY_CONTAINS(c.list, { prop: 10 })
 *
 * 4. Array item range checks
 *     - Scans array elements, less efficient
 *     - Example: EXISTS (SELECT VALUE l FROM l IN c.list WHERE l.prop > 10)
 *
 * 5. Prefix search (STARTSWITH)
 *     - More efficient than CONTAINS
 *     - Example: STARTSWITH(c.x, "prefix")
 *
 * 6. Text search
 *     - Expensive, full field scan
 *     - Example: CONTAINS(c.x, "word")
 *
 * 7. Array item text search
 *     - Full array scan, very costly
 *     - Example: EXISTS (SELECT VALUE l FROM l IN c.list WHERE CONTAINS(l.prop, "word"))
 *
 * 8. Negation
 *     - Forces a full scan, avoid when possible
 *     - Example: c.x != 10
 *     - Example: NOT ARRAY_CONTAINS(c.list, { prop: 10 })
 *
 * 9. OR conditions
 *     - Expands search space, reduces index efficiency
 *     - Example: c.x = 10 OR c.y = 20
 *     - Example: (c.x > 10 OR c.y < 5) AND c.z = "value"
 *
 * 10. JOIN on arrays
 *     - Worst performance, use only when necessary
 *     - Example: JOIN l IN c.list
 */
export class Query {
  private whereClauses: string[] = [];
  private params: Record<string, JSONValue> = {};

  /**
   * Adds a WHERE clause to the query.
   * @param clause - The WHERE clause to add
   * @param parameters - Optional parameters for the clause
   * @returns The QueryBuilder instance
   */
  where([clause, parameters = {}]: Where): this {
    this.whereClauses.push(clause);
    Object.assign(this.params, parameters);
    return this;
  }

  whereCondition(...[field, op, value]: Condition): this {
    return this.where(Query.condition(field, op, value));
  }

  whereTwinCondition(baseField: string, conditions: Condition[]) {
    return this.where(Query.twinCondition(baseField, conditions));
  }

  /**
   * Builds the SQL query
   * @returns The SQL query and parameters
   */
  build(): SqlQuerySpec {
    const where = this.whereClauses.length
      ? `WHERE ${this.whereClauses.map((x) => `(${x})`).join(" AND ")}`
      : "";
    return {
      query: `SELECT TOP 24 * FROM c ${where}`,
      parameters: Object.entries(this.params).map(([name, value]) => ({
        name,
        value,
      })),
    };
  }

  static or(
    [clause1, parameters1]: Where,
    [clause2, parameters2]: Where
  ): Where {
    return [`(${clause1}) OR (${clause2})`, { ...parameters1, ...parameters2 }];
  }

  static condition(...[field, op, value]: Condition): Where {
    const [prop, param] = toPair(field);

    if (op === "CONTAINS") {
      return [
        `CONTAINS(LOWER(${prop}), ${param})`,
        { [param]: String(value).toLowerCase() },
      ];
    }

    return [`${prop} ${op} ${param}`, { [param]: value }];
  }

  static twinCondition(baseField: string, conditions: Condition[]): Where {
    const singleField = `c.${baseField}`;
    const listField = `c.${baseField}List`;
    const boolField = `c.${baseField}HasMultiple`;

    const singleConditions: string[] = [];
    const multiConditions: string[] = [];
    const multiConditionsAllEq: string[] = [];
    const params: Record<string, JSONValue> = {};

    conditions.forEach(([field, op, value]) => {
      const param = toParam(field);
      if (op === "CONTAINS") {
        singleConditions.push(
          `CONTAINS(LOWER(${singleField}.${field}), ${param})`
        );
        multiConditions.push(`CONTAINS(LOWER(l.${field}), ${param})`);
        params[param] = String(value).toLowerCase();
      } else {
        singleConditions.push(`${singleField}.${field} ${op} ${param}`);
        multiConditions.push(`l.${field} ${op} ${param}`);
        params[param] = value;

        if (op === "=") {
          multiConditionsAllEq.push(`${field}: ${param}`);
        }
      }
    });

    const singleConditionString = singleConditions.join(" AND ");
    const singleClause = `${boolField} = false AND ${singleConditionString}`;
    const multiConditionString = multiConditions.join(" AND ");
    const multiClause = `${boolField} = true AND EXISTS (SELECT VALUE l FROM l IN ${listField} WHERE ${multiConditionString}`;
    const multiConditionAllEqString = `{ ${multiConditionsAllEq.join(", ")} }`;
    const multiClauseAllEq = `${boolField} = true AND ARRAY_CONTAINS(${listField}, ${multiConditionAllEqString}, true)`;

    if (multiConditionsAllEq.length === multiConditions.length) {
      return [`(${singleClause}) OR (${multiClauseAllEq})`, params];
    }

    return [`(${singleClause}) OR (${multiClause})`, params];
  }
}

const toPair = (field: string) => [`c.${field}`, toParam(field)] as const;
const toParam = (field: string) => `@${field.replace(/\./g, "_")}`;
