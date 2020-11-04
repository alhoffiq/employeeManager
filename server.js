const mysql = require('mysql');
const inquirer = require("inquirer");
const { spawn } = require('child_process');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'painkiller7',
    database: 'employees_db'
});

connection.connect(function (err) {
    if (err) {
        console.error("error connecting: " + err.stack);
        return;
    }
    console.log("connected as id " + connection.threadId);
    start();
});

function start() {
    inquirer.prompt([
        {
            name: "action",
            type: "list",
            message: "What would you like to do?",
            choices: ["View employees", "View roles", "View departments", "Add employee", "Add role", "Add department", "Update employee's role"]
        },
    ]).then(answers => {
        switch (answers.action) {
            case "View employees": // This mess gets all the data about each employee and adds the manager's name to their listing in an overly complicated way
                connection.query('SELECT manager_id, employee.id, first_name, last_name, title, salary, department_name FROM employee LEFT JOIN role ON role.id = employee.role_id LEFT JOIN department ON department.id = role.department_id', function (err, res) {
                    if (err) throw err;
                    connection.query("SELECT manager.first_name, manager.last_name FROM employee LEFT JOIN employee manager ON employee.manager_id = manager.id", function (err2, res2) {
                        if (err) throw err;
                        for (let i = 0; i < res.length; i++) {
                            if (res[i].manager_id != null) {
                                res[i].manager_name = res2[i].first_name + " " + res2[i].last_name;
                            }
                        }
                        console.table(res);
                    });
                    connection.end();
                });
                break;
            case "View roles": // Gets all the role data
                connection.query('SELECT title, salary, department_name FROM role LEFT JOIN department ON role.department_id = department.id', function (err, res) {
                    if (err) throw err;
                    console.table(res);
                    connection.end();
                });
                break;
            case "View departments": // Gets all the department data
                connection.query('SELECT department_name FROM department', function (err, res) {
                    if (err) throw err;
                    console.table(res);
                    connection.end();
                });
                break;
        }
    })
}