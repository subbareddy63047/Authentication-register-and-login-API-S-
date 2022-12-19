const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

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

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

app.post("/users/", async (request, response) => {
  const { username, name, password, location, gender } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectedUserQuery = `
    select * from user
    where username='${username}';`;
  const dbUser = await db.get(selectedUserQuery);
  if (dbUser === undefined) {
    const newUser = `
            INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;
    await db.run(newUser);
    response.send("Create successfully");
  } else {
    response.status(400);
    response.send("Already user name exist");
  }
});
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  try {
    const selectUserQuery = `
    select * from user
    where username='${username}';`;
    const dbUser = await db.get(selectUserQuery);

    if (dbUser === undefined) {
      response.send(400);
      response.send("User doesn't exist");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        response.send("login successfully");
      } else {
        response.send(400);
        response.send("Invalid Password");
      }
    }
  } catch (error) {
    response.send(`${error.message}`);
  }
});
