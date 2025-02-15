import type { JSONValue, SqlQuerySpec } from "@azure/cosmos";

type Op = "<" | "<=" | "=" | ">" | ">=" | "CONTAINS";

export type Condition = [field: string, op: Op, value: JSONValue];
export type Where = [clause: string, parameters?: Record<string, JSONValue>];

/**
 * Helper class for building SQL queries
 *
 * When adding WHERE clauses to the QueryBuilder, prefer clauses that
 * - Make the best use of the index
 * - Reduce the number of documents scanned
 *
 * Preferring and ordering by the most efficient and selective filters
 * reduces the number of documents scanned, improving query speed and lowering RU costs.
 * Treat ORs as if they are the worst of their parts.
 *
 * Prefer WHERE clauses in this order:
 *
 * 1. Index Seek (=, IN)
 *     - Read only required indexed values and load only matching items.
 *     - RU (index): Constant per equality filter
 *     - RU (load): Query result count
 *     - Example: c.x = 10
 *     - Example: c.x IN ("value1", "value2", "value3")
 *     - Example: ARRAY_CONTAINS(c.list, { x: 10 })
 *
 * 2. Precise Index Scan (>, >=, <, <=, STARTSWITH)
 *     - Binary search of indexed values and load only matching items
 *     - RU (index): Comparable to index seek, increases slightly based on the cardinality of indexed properties
 *     - RI (load): Query result count
 *     - Example: c.x > 10
 *     - Example: STARTSWITH(c.x, "prefix")
 *     - Example: EXISTS (SELECT VALUE l FROM l IN c.list WHERE l.x > 10)
 *
 * 3. Expanded Index Scan (case-insensitive STARTSWITH, StringEquals)
 *    - Optimized search (but less efficient than a binary search) of indexed values and load only matching items
 *    - RU (index): Increases slightly based on the cardinality of indexed properties
 *    - RU (load): Query result count
 *
 * 4. Full Index Scan (CONTAINS, EndsWith, RegexMatch, LIKE)
 *    - Read distinct set of indexed values and load only matching items
 *    - RU (index): Increases linearly based on the cardinality of indexed properties
 *    - RU (load): Query result count
 *    - Example: CONTAINS(c.x, "word")
 *    - Example: EXISTS (SELECT VALUE l FROM l IN c.list WHERE CONTAINS(l.x, "word"))
 *
 * 5. Full Scan (Negation, UPPER, LOWER)
 *    - Load all items
 *    - RU (index): N/A
 *    - RU (load): Increases based on number of items in container
 *    - Example: c.x != 10
 *    - Example: NOT ARRAY_CONTAINS(c.list, { x: 10 })
 *    - Example: JOIN l IN c.list
 */
export class Query {
  private whereClauses: string[] = [];
  private params: Record<string, JSONValue> = {};

  /**
   * Adds a WHERE clause to the query.
   * @param clause - The WHERE clause to add
   * @param parameters - Optional parameters for the clause
   * @returns The Query instance for method chaining
   */
  where([clause, parameters = {}]: Where): this {
    this.whereClauses.push(clause);
    Object.assign(this.params, parameters);
    return this;
  }

  /**
   * Adds a WHERE condition using field, operator, and value.
   * Automatically handles parameter naming and value formatting.
   * @param field - Document field path (e.g., "status" or "facets.experience")
   * @param op - Comparison operator (<, <=, =, >, >=, CONTAINS)
   * @param value - Value to compare against
   * @returns The Query instance for method chaining
   */
  whereCondition(...[field, op, value]: Condition): this {
    return this.where(Query.condition(field, op, value));
  }

  /**
   * Builds and returns the final SQL query specification.
   * @returns Object containing the SQL query string and parameter definitions
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

  /**
   * Creates a WHERE clause from field, operator, and value.
   * Automatically handles parameter naming and value formatting.
   * @param field - Document field path
   * @param op - Comparison operator
   * @param value - Value to compare against
   * @returns WHERE clause and its parameters
   */
  static condition(...[field, op, value]: Condition): Where {
    const [prop, param] = toPair(field);

    if (op === "CONTAINS") {
      return [`CONTAINS(${prop}, ${param}, true)`, { [param]: value }];
    }

    return [`${prop} ${op} ${param}`, { [param]: value }];
  }
}

const toPair = (field: string) => [`c.${field}`, toParam(field)] as const;
const toParam = (field: string) => `@${field.replace(/\./g, "_")}`;
