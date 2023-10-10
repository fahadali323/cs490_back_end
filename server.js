import express from 'express';
import { top_actor, top_movies, top_movies_description, actor_details, 
         searchMoviesByType, film_details, 
         searchCustomers } from './database.js';
import cors from 'cors';

const app = express();

// Use the cors middleware
app.use(cors());


app.get("/top_movies", async (req, res) => {
  const movies = await top_movies();
  res.send(movies);
});

app.get("/movies_description", async( req,res)=> {
  const description = await top_movies_description();
  res.send(description);
})


app.get("/top_actors", async ( req, res) => {
  const actors = await top_actor();
  res.send(actors);
})

app.get("/actor_details/:id", async(req,res)=> {
  const id = req.params.id
  const single_actor = await actor_details(id);
  res.send(single_actor)
})

//movies page logic 
app.get('/movies/search', async (req, res) => {
  const type = req.query.type || ''; // Get the type from the query parameters
  const search = req.query.search || ''; // Get the search term from the query parameters

  try {
    const movies = await searchMoviesByType(type, search);

    if (movies.length === 0) {
      return res.status(404).json({ message: 'No results found.' });
    }

    return res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.get("/movies/:id", async(req,res)=> {
  const id = req.params.id
  const single_movie = await film_details(id);
  res.send(single_movie)
})

//customer's page logic 
app.get('/customers', async (req, res) => {
  try {
    const customers = await viewAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/customers/search', async (req, res) => {
  try {
    const { customerId, firstName, lastName } = req.query;
    const customers = await searchCustomers(customerId, firstName, lastName);
    
    if (customers.length === 0) {
      return res.status(404).json({ message: 'No results found.' });
    }

    return res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
