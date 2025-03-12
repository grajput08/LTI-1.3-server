declare module "ltijs-sequelize" {
  interface DatabaseOptions {
    host: string;
    dialect: "postgres" | "mysql" | "sqlite" | "mariadb" | "mssql";
    logging?: boolean | Function;
    port?: number;
  }

  class Database {
    constructor(
      database: string,
      username: string,
      password: string,
      options: DatabaseOptions
    );
  }

  export default Database;
}
