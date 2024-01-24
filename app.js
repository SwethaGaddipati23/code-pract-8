const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let arrayResponse = "";
  let todoQuery = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      todoQuery = `select * from todo where search_q like %'${search_q}'% and priority='${priority}' and status='${status}';`;
      break;
    case hasStatus(request.query):
      todoQuery = `select * from todo where search_q like %'${search_q}'% and status='${status}';`;
      break;
    case hasPriority(request.query):
      todoQuery = `select * from todo where search_q like %'${search_q}'% and priority='${priority}';`;
      break;
    default:
      todoQuery = `select * from todo where search_q like %'${search_q}'%;`;
  }
  arrayResponse = await db.all(todoQuery);
  response.send(arrayResponse);
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `select * from todo where id=${todoId};`;
  const arrayTodo = await db.get(todoQuery);
  response.send(arrayTodo);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const dbQuery = `insert into todo values (
        ${id},'${todo}','${priority}','${status}'
    );`;
  await db.run(dbQuery);
  response.send("Todo Successfully Added");
});

//put api

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

});
//
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `delete from todo where id=${todoId};`;
  await db.run(dbQuery);
  response.send("Todo Deleted");
});

module.exports = app;
