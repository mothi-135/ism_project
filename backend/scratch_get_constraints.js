const db = require('./db');

const query = `
SELECT 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type 
FROM 
    information_schema.table_constraints tc 
JOIN 
    information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema 
WHERE 
    tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY') 
    AND tc.table_schema = 'public' 
ORDER BY 
    tc.table_name, tc.constraint_type;
`;

db.query(query)
  .then(res => {
    console.table(res.rows);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
