
import express from "express";
import pg from "pg";

const app = express();
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory');
const port = process.env.PORT || 3000;


app.use(express.json());

app.get('/api/departments', async (req, res, next) => {
    try{
        const SQL = `
        SELECT * FROM departments;
        `;
        
        const response = await client.query(SQL);
        res.send(response.rows);

    } catch(ex) {
        next(ex)
    }
})

app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM employees;
        `;
        const response = await client.query(SQL)
        res.send(response.rows)

    }
    catch(ex) {
        next(ex)
    }
})

app.post('/api/employees', async (req, res, next) => {
    try{
        const SQL =`  
        INSERT INTO employees(name, department_id),
        VALUES ($1, $2),
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.department_id]);
        res.send(response.rows[0])

    }catch(ex) {
        next(ex)
    }
})

app.put('/api/employees/:id', async (req, res, next) => {
    try{
        const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id]);
        res.send(response.rows[0]);

    } catch(ex) {
        next(ex);
    }
})

app.delete(`/api/employees/:id`, async ( req, res, next) => {
    try{
        const SQL =`
        DELETE FROM employees WHERE id=$1;
        `;
        await client.query(SQL, [req.params.id])
        res.sendStatus(204);
    } catch(ex) {
        next(ex)
    }
 })

 async function init(){
    await client.connect();
    console.log("connected to client");
    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
        );
        CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log("tables created");
    SQL = `
        INSERT INTO departments(name) VALUES('Accounting and Finance');
        INSERT INTO departments(name) VALUES('Administration and HR');
        INSERT INTO departments(name) VALUES('Workforce Development');
        INSERT INTO departments(name) VALUES('People Success Team');
        INSERT INTO employees(name, department_id) VALUES('John', (SELECT id FROM departments where name='Accounting and Finance'));
        INSERT INTO employees(name, department_id) VALUES('Jane', (SELECT id FROM departments where name='Administration and HR'));
        INSERT INTO employees(name, department_id) VALUES('Bob', (SELECT id FROM departments where name='Workforce Development'));
        INSERT INTO employees(name, department_id) VALUES('Mary', (SELECT id FROM departments where name='People Success Team'));
        `;
        await client.query(SQL);
        console.log("data seeded");
        app.listen(port, () => console.log(`listening on port ${port}`));

};
init()