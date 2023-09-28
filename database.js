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