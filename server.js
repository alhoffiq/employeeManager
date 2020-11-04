const mysql = require('mysql');
const inquirer = require("inquirer");
const { allowedNodeEnvironmentFlags } = require('process');
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
    let roles = [];
    let employees = [];
    connection.query("SELECT title FROM role", function (err, res) { // Puts all roles into an array to start
        if (err) throw err;
        res.forEach(role => {
            roles.push(role.title);
        });
        connection.query("SELECT CONCAT(first_name, ' ', last_name) AS fullName FROM employee", function (err, res) { // Puts all employees into an array to start
            if (err) throw err;
            res.forEach(employee => {
                employees.push(employee.fullName);
            });
            inquirer.prompt([
                {
                    name: "action",
                    type: "list",
                    message: "What would you like to do?",
                    choices: ["View employees", "View roles", "View departments", "Add employee", "Add role", "Add department", "Update employee's role", "Stop"]
                },
            ]).then(answers1 => {
                switch (answers1.action) {
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
                                start();
                            });
                        });
                        break;
                    case "View roles": // Gets all the role data
                        connection.query('SELECT title, salary, department_name FROM role LEFT JOIN department ON role.department_id = department.id', function (err, res) {
                            if (err) throw err;
                            console.table(res);
                            start();
                        });
                        break;
                    case "View departments": // Gets all the department data
                        connection.query('SELECT department_name FROM department', function (err, res) {
                            if (err) throw err;
                            console.table(res);
                            start();
                        });
                        break;
                    case "Add employee":
                        addEmployee(roles, employees);
                        break;
                    case "Add role":
                        let departments = [];
                        connection.query("SELECT department_name FROM department", function (err, res) {
                            if (err) throw err;
                            res.forEach(department => {
                                departments.push(department.department_name);
                            });
                            addRole(departments);
                        });
                        break;
                    case "Add department":
                        addDepartment();
                        break;
                    case "Update employee's role":
                        updateRole(roles, employees);
                        break;
                    case "Stop":
                        connection.end();
                        break;
                }
            })
        });
    });
}

function addEmployee(roles, employees) {
    employees.push("None"); // Gives the "no manager" option
    inquirer.prompt([
        {
            name: "firstName",
            type: "input",
            message: "What is the employee's first name?"
        }, {
            name: "lastName",
            type: "input",
            message: "What is the employee's last name?"
        }, {
            name: "role",
            type: "list",
            message: "What is the employee's role?",
            choices: roles
        }, {
            name: "manager",
            type: "list",
            message: "Who is the employee's manager? (If they have one)",
            choices: employees
        }

    ]).then(answers2 => {
        let firstName = answers2.firstName;
        let lastName = answers2.lastName;
        let roleId;
        let managerId;
        connection.query("SELECT id FROM role WHERE title = ?", [answers2.role], function (err, res) { // Turns role name into it's ID
            if (err) throw err;
            roleId = res[0].id;
            if (answers2.manager === "None") {
                managerId = null;
            } else {
                connection.query("SELECT * FROM employee WHERE CONCAT(first_name, ' ', last_name) = ?", [answers2.manager], function (err, res) { // Turns employee name into their ID
                    if (err) throw err;
                    managerId = res[0].id;
                    connection.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES(?,?,?,?)', [firstName, lastName, roleId, managerId], function (err, res) {
                        if (err) throw err;
                        console.log("Employee added!");
                        start();
                    });
                })
            }
        })

    });
}

function addRole(departments) {
    inquirer.prompt([
        {
            name: "name",
            type: "input",
            message: "What is the name of this role?"
        }, {
            name: "salary",
            type: "input",
            message: "What is the starting salary for this role?"
        }, {
            name: "department",
            type: "list",
            message: "What department does this role work in?",
            choices: departments
        }

    ]).then(answers3 => {
        let name = answers3.name;
        let salary = answers3.salary;
        let departmentId;
        connection.query("SELECT id FROM department WHERE department_name = ?", [answers3.department], function (err, res) { // Turns department name into it's ID
            if (err) throw err;
            departmentId = res[0].id;
            connection.query('INSERT INTO role (title, salary, department_id) VALUES(?,?,?)', [name, salary, departmentId], function (err, res) {
                if (err) throw err;
                console.log("Role added!");
                start();
            });
        });
    });
};

function addDepartment() {
    inquirer.prompt([
        {
            name: "name",
            type: "input",
            message: "What is the name of this department?"
        }
    ]).then(answers4 => {
        connection.query('INSERT INTO department (department_name) VALUES(?)', [answers4.name], function (err, res) {
            if (err) throw err;
            console.log("Department added!");
            start();
        });
    });
};

function updateRole(roles, employees) {
    inquirer.prompt([
        {
            name: "employee",
            type: "list",
            message: "Which employee's role would you like to update?",
            choices: employees
        }, {
            name: "role",
            type: "list",
            message: "Which role would you like to update them to?",
            choices: roles
        },
    ]).then(answers4 => {
        let roleId;
        let employeeId;
        connection.query("SELECT id FROM role WHERE title = ?", [answers4.role], function (err, res) { // Turns role name into it's ID
            if (err) throw err;
            roleId = res[0].id;
            connection.query("SELECT id FROM employee WHERE CONCAT(first_name, ' ', last_name) = ?", [answers4.employee], function (err, res) { // Turns employee name into it's ID
                if (err) throw err;
                employeeId = res[0].id;
                connection.query('UPDATE employee SET role_id = ? WHERE employee.id = ?', [roleId, employeeId], function (err, res) {
                    if (err) throw err;
                    console.log("Employee updated!");
                    start();
                });
            });
        });
    });
}