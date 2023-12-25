const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const checkPriority = (priority) => {
  return priority === "HIGH" || priority === "MEDIUM" || priority === "LOW";
};

const checkStatus = (status) => {
  return status === "TO DO" || status === "IN PROGRESS" || status === "DONE";
};

const checkCategory = (category) => {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
};

const checkDate = (date) => {
  return isValid(new Date(date));
};

//API 1

const responseObject = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

const invalidTodo = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    date = "",
    search_q = "",
  } = request.query;

  switch (true) {
    case checkStatus(status):
      next();
      break;
    case checkPriority(priority):
      next();
      break;
    case checkCategory(category):
      next();
      break;
    case checkDate(date):
      next();
      break;
    case search_q !== "":
      next();
      break;

    default:
      if (status !== "") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (priority !== "") {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (category !== "") {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (date !== "") {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
};

app.get("/todos/", invalidTodo, async (request, response) => {
  const { status, priority, category, search_q } = request.query;
  switch (true) {
    case checkStatus(status):
      const query1 = `SELECT * FROM todo WHERE status LIKE '${status}';`;
      const data1 = await db.all(query1);
      response.send(data1.map((each) => responseObject(each)));
      break;
    case checkPriority(priority):
      const query2 = `SELECT * FROM todo WHERE priority LIKE '${priority}';`;
      const data2 = await db.all(query2);
      response.send(data2.map((each) => responseObject(each)));
      break;
    case checkCategory(category):
      const query3 = `SELECT * FROM todo WHERE category LIKE '${category}';`;
      const data3 = await db.all(query3);
      response.send(data3.map((each) => responseObject(each)));
      break;
    case checkCategory(category) && checkStatus(status):
      const query4 = `SELECT * FROM todo WHERE category LIKE '${category}' AND status LIKE '${status}';`;
      const data4 = await db.all(query4);
      response.send(data4.map((each) => responseObject(each)));
      break;
    case checkPriority(priority) && checkStatus(status):
      const query5 = `SELECT * FROM todo WHERE priority LIKE '${priority}' AND status LIKE '${status}';`;
      const data5 = await db.all(query5);
      response.send(data5.map((each) => responseObject(each)));
      break;
    case checkPriority(priority) && checkCategory(category):
      const query6 = `SELECT * FROM todo WHERE priority LIKE '${priority}' AND category LIKE '${category}';`;
      const data6 = await db.all(query6);
      response.send(data6.map((each) => responseObject(each)));
      break;
    case search_q !== undefined:
      const query7 = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      const data7 = await db.all(query7);
      response.send(data7.map((each) => responseObject(each)));
      break;
  }
});

// API 2

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id = '${todoId}';`;
  const getDetails = await db.get(getQuery);
  response.send(responseObject(getDetails));
});

//API 3

app.get("/agenda/", invalidTodo, async (request, response) => {
  const { date } = request.query;
  const dateFormat = format(new Date(date), "yyyy-MM-dd");
  const newDate = new Date(dateFormat);

  const dateQuery = `SELECT * FROM todo WHERE strftime("%Y-%m-%d", due_date) = '${dateFormat}'`;

  const dateData = await db.all(dateQuery);
  response.send(dateData.map((each) => responseObject(each)));
});

//API 4

const validBody = (request, response, next) => {
  const details = request.body;
  const {
    id = "",
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = details;

  switch (true) {
    case checkStatus(status):
    case checkPriority(priority):
    case checkCategory(category):
    case checkDate(dueDate):
      next();

    default:
      if (!checkStatus(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (!checkPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (!checkCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (!checkDate(dueDate)) {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
};

app.post("/todos/", validBody, async (request, response) => {
  const details = request.body;
  const { id, todo, priority, status, category, dueDate } = details;
  switch (true) {
    case checkCategory(category) &&
      checkDate(dueDate) &&
      checkPriority(priority) &&
      checkStatus(status):
      const formatDate = format(new Date(dueDate), "yyyy-MM-dd");
      const addQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date)
                       VALUES(
                           '${id}',
                           '${todo}',
                           '${priority}',
                           '${status}',
                           '${category}',
                           '${formatDate}'
                       )`;
      await db.run(addQuery);
      response.send("Todo Successfully Added");
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const {
    status = "",
    priority = "",
    todo = "",
    category = "",
    dueDate = "",
  } = request.body;
  const { todoId } = request.params;
  switch (true) {
    case checkStatus(status):
      const updateQuery1 = `UPDATE todo SET status = '${status}' WHERE id = '${todoId}';`;
      await db.run(updateQuery1);
      response.send("Status Updated");
      break;
    case checkPriority(priority):
      const updateQuery2 = `UPDATE todo SET priority = '${priority}' WHERE id = '${todoId}';`;
      await db.run(updateQuery2);
      response.send("Priority Updated");
      break;
    case checkCategory(category):
      const updateQuery3 = `UPDATE todo SET category = '${category}' WHERE id = '${todoId}';`;
      await db.run(updateQuery3);
      response.send("Category Updated");
      break;
    case todo !== "":
      const updateQuery4 = `UPDATE todo SET todo = '${todo}' WHERE id = '${todoId}';`;
      await db.run(updateQuery4);
      response.send("Todo Updated");
      break;
    case checkDate(dueDate):
      const formatDate = format(new Date(dueDate), "yyyy-MM-dd");
      const updateQuery5 = `UPDATE TODO SET due_date = '${formatDate}' WHERE id = '${todoId}';`;
      await db.run(updateQuery5);
      response.send("Due Date Updated");
      break;
    default:
      if (status !== "") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (priority !== "") {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (category !== "") {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (dueDate !== "") {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM TODO WHERE id = '${todoId}';`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
