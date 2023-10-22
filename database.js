import mysql2 from 'mysql2'
import dotevn from 'dotenv'; dotevn.config()


const connection = mysql2.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}).promise()

export async function top_movies() {
  const [rows] = await connection.query(`SELECT f.title, COUNT(*) AS rental_count
                    FROM rental r
                    JOIN inventory i ON r.inventory_id = i.inventory_id
                    JOIN film f ON i.film_id = f.film_id
                    GROUP BY f.title
                    ORDER BY rental_count DESC
                    LIMIT 5;`)
  return rows
}

// const movies = await top_movies()
// console.log(movies);

export async function top_movies_description() {
  const [rows] = await connection.query(`WITH TopMovies AS (
        SELECT f.title
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        GROUP BY f.title
        ORDER BY COUNT(*) DESC
        LIMIT 5
    )
    SELECT f.title, f.description, f.release_year, f.rating, f.special_features, COUNT(*) AS rental_count
    FROM rental r
    JOIN inventory i ON r.inventory_id = i.inventory_id
    JOIN film f ON i.film_id = f.film_id
    WHERE f.title IN (SELECT title FROM TopMovies)
    GROUP BY f.title, f.description, f.release_year, f.rating, f.special_features
    ORDER BY rental_count DESC;
    `)
  return rows
}

// const movies_description = await top_movies_description()
// console.log(movies_description)


export async function top_actor() {
  const [rows] = await connection.query(`SELECT actor.actor_id,
    actor.first_name,
    actor.last_name,
    COUNT(film_actor.film_id) AS film_count
    FROM actor
    INNER JOIN film_actor ON actor.actor_id = film_actor.actor_id
    GROUP BY actor.actor_id
    ORDER BY film_count DESC
    LIMIT 5;
    `)
  return rows
}


// const actor = await top_actor()
// console.log(actor);

export async function actor_details(id) {
  const [rows] = await connection.query(`SELECT a.actor_id,
    a.first_name,
    a.last_name,
    r.film_id,
    f.title,
    r.rental_count
    FROM (
    SELECT actor.actor_id,
        actor.first_name,
        actor.last_name
    FROM actor
    WHERE actor.actor_id = ?    
    ) a
    INNER JOIN (
    SELECT ra.actor_id,
        ra.film_id,
        ra.rental_count,
        ROW_NUMBER() OVER (PARTITION BY ra.actor_id ORDER BY ra.rental_count DESC) AS rn
    FROM (
    SELECT actor.actor_id, f.film_id, COUNT(r.rental_id) AS rental_count
    FROM actor
    INNER JOIN film_actor ON actor.actor_id = film_actor.actor_id
    INNER JOIN film f ON film_actor.film_id = f.film_id
    INNER JOIN inventory i ON f.film_id = i.film_id
    INNER JOIN rental r ON i.inventory_id = r.inventory_id
    WHERE actor.actor_id = ?
    GROUP BY actor.actor_id, f.film_id
    ) ra
    ) r ON a.actor_id = r.actor_id
    INNER JOIN film f ON r.film_id = f.film_id
    WHERE r.rn <= 5
    ORDER BY a.actor_id, r.rental_count DESC`, [id, id])
  return rows
}

// const act_details = await actor_details(23);
// console.log(act_details)

export async function searchMoviesByType(type, search) {
  let queryStr;
  const searchValue = `%${search}%`;

  try {
    if (type === 'film') {
      queryStr = `
          SELECT film.*, GROUP_CONCAT(DISTINCT actor.first_name, ' ', actor.last_name) AS actors, GROUP_CONCAT(DISTINCT category.name) AS genres
          FROM film
          LEFT JOIN film_actor ON film.film_id = film_actor.film_id
          LEFT JOIN actor ON film_actor.actor_id = actor.actor_id
          LEFT JOIN film_category ON film.film_id = film_category.film_id
          LEFT JOIN category ON film_category.category_id = category.category_id
          WHERE film.title LIKE ?
          GROUP BY film.film_id
        `;
    } else if (type === 'actor') {
      queryStr = `
          SELECT film.*, GROUP_CONCAT(DISTINCT actor.first_name, ' ', actor.last_name) AS actors, GROUP_CONCAT(DISTINCT category.name) AS genres
          FROM film
          LEFT JOIN film_actor ON film.film_id = film_actor.film_id
          LEFT JOIN actor ON film_actor.actor_id = actor.actor_id
          LEFT JOIN film_category ON film.film_id = film_category.film_id
          LEFT JOIN category ON film_category.category_id = category.category_id
          WHERE actor.first_name LIKE ? OR actor.last_name LIKE ?
          GROUP BY film.film_id
        `;
    } else if (type === 'genre') {
      queryStr = `
          SELECT film.*, GROUP_CONCAT(DISTINCT actor.first_name, ' ', actor.last_name) AS actors, GROUP_CONCAT(DISTINCT category.name) AS genres
          FROM film
          LEFT JOIN film_actor ON film.film_id = film_actor.film_id
          LEFT JOIN actor ON film_actor.actor_id = actor.actor_id
          LEFT JOIN film_category ON film.film_id = film_category.film_id
          LEFT JOIN category ON film_category.category_id = category.category_id
          WHERE category.name LIKE ?
          GROUP BY film.film_id
        `;
    }

    const [rows] = await connection.query(queryStr, [searchValue, searchValue]);
    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// get each films by its id
export async function film_details(filmId) {
  const [rows] = await connection.query(`
    SELECT f.film_id,
           f.title,
           f.description,
           f.release_year,
           f.rating,
           f.length,
           f.special_features,
           COUNT(r.rental_id) AS rental_count,
           GROUP_CONCAT(DISTINCT c.name ORDER BY c.name) AS categories,
           GROUP_CONCAT(DISTINCT a.first_name, ' ', a.last_name ORDER BY a.first_name, a.last_name) AS actors
    FROM film f
    INNER JOIN inventory i ON f.film_id = i.film_id
    INNER JOIN rental r ON i.inventory_id = r.inventory_id
    LEFT JOIN film_category fc ON f.film_id = fc.film_id
    LEFT JOIN category c ON fc.category_id = c.category_id
    INNER JOIN film_actor fa ON f.film_id = fa.film_id
    INNER JOIN actor a ON fa.actor_id = a.actor_id
    WHERE f.film_id = ?
    GROUP BY f.film_id
  `, [filmId]);

  return rows;
}


///display all customers based on id, first or last name
export async function searchCustomers(customerId, firstName, lastName) {
  try {
    let query = 'SELECT * FROM customer WHERE 1';

    if (customerId) {
      query += ` AND customer_id = ${customerId}`;
    }

    if (firstName) {
      query += ` AND first_name LIKE '%${firstName}%'`;
    }

    if (lastName) {
      query += ` AND last_name LIKE '%${lastName}%'`;
    }

    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

///adding a new customer
export async function addCustomer(newCustomer) {
  try {
    const {
      store_id,
      first_name,
      last_name,
      email,
      address_id,
      active,
    } = newCustomer;

    const query = `
      INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, create_date)
      VALUES (?, ?, ?, ?, ?, ?, NOW());
    `;

    const [rows] = await connection.query(query, [store_id, first_name, last_name, email, address_id, active]);
    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
//update customer's details
export async function updateCustomer(customer_id, store_id, first_name, last_name, email, address_id, active) {
  try {
    const query = `
      UPDATE customer
      SET store_id = ?, first_name = ?, last_name = ?, email = ?, address_id = ?, active = ?
      WHERE customer_id = ?;
    `;

    const [rows] = await connection.query(query, [store_id, first_name, last_name, email, address_id, active, customer_id]);
    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//delete customer's details and data
export async function deleteCustomer(customerId) {
  try {
    const [rows] = await connection.execute('DELETE FROM customer WHERE customer_id = ?', [customerId]);
    return rows;
  } catch (error) {
    throw error;
  }
}
//view customer's rented movies
export async function viewCustomerMovies(customerId) {
  try {
    const [rows] = await connection.execute(`
    SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    f.title AS movie_title,
    r.rental_date,
    r.return_date
    FROM customer c
    JOIN rental r ON c.customer_id = r.customer_id
    JOIN inventory i ON r.inventory_id = i.inventory_id
    JOIN film f ON i.film_id = f.film_id
    WHERE c.customer_id = ?`, [customerId]);
    return rows;
  } catch (error) {
    throw error;
  }
}
////


export async function createRental(customer_id, film_id, staff_id) {
  try {
    // Check if the customer and film exist in the database
    const [customer] = await connection.query('SELECT * FROM customer WHERE customer_id = ?', [customer_id]);
    const [film] = await connection.query('SELECT * FROM film WHERE film_id = ?', [film_id]);

    if (customer.length === 0 || film.length === 0) {
      return { success: false, message: 'Customer or film not found' };
    }

    // Create a new rental record with staff_id
    const [rentalResult] = await connection.query(
      'INSERT INTO rental (customer_id, inventory_id, rental_date, return_date, staff_id) VALUES (?, ?, NOW(), NULL, ?)',
      [customer_id, film_id, staff_id] // You can set a default staff ID here or provide it as needed
    );


    // Check if the rental was successfully created
    if (rentalResult.affectedRows > 0) {
      return { success: true, message: 'Film rented successfully' };
    } else {
      return { success: false, message: 'Failed to rent the film' };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Internal Server Error' };
  }
}