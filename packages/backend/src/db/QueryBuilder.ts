import type { JSONValue, SqlParameter, SqlQuerySpec } from "@azure/cosmos";

/**
 * Helper class for building SQL queries
 */
export class QueryBuilder {
  private whereClauses: string[] = [];
  private params: SqlParameter[] = [];

  /**
   * Adds a WHERE clause to the query.
   *
   * Where clauses should ideally be ordered by:
   * 1. The most selective filter first (ie. likely to filter out the most documents)
   * 2. Filter efficiency (equality > range > contains)
   * @param clause - The WHERE clause to add
   * @param parameters - Optional parameters for the clause
   * @returns The QueryBuilder instance
   */
  where(clause: string, parameters?: Record<string, JSONValue>): this {
    this.whereClauses.push(clause);
    if (parameters) {
      for (const [name, value] of Object.entries(parameters)) {
        this.params.push({ name, value });
      }
    }
    return this;
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
      parameters: this.params,
    };
  }
}
