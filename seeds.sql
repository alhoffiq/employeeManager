INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Andrew", "Hoff", 1, 3),("John", "Smith", 2, 3),("Jack","Williams", 3, null);

INSERT INTO role (title, salary, department_id)
VALUES ("Pharmacy Technician", 40000, 1),("Cashier", 25000, 2),("Manager", 45000, 2);

INSERT INTO department (department_name)
VALUES ("Pharmacy"),("Retail");