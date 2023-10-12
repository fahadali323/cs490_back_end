import express from 'express';
import { top_actor, top_movies, top_movies_description, actor_details, 
         searchMoviesByType, film_details, 
         searchCustomers,
         addCustomer,
         updateCustomer, 
         deleteCustomer,
         viewCustomerMovies, } from './database.js';
import cors from 'cors';

const app = express();

// Use the cors middleware
app.use(cors());

app.use(express.json());


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

// customer's page logic 
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
///adding customers route
app.post('/customers/add', async (req, res) => {
  try {
    const {
      store_id,
      first_name,
      last_name,
      email,
      address_id,
      active,
    } = req.body;

    const newCustomer = {
      store_id,
      first_name,
      last_name,
      email,
      address_id,
      active,
    };

    const result = await addCustomer(newCustomer);

    if (result.affectedRows > 0) {
      res.status(201).json({ message: 'Customer added successfully', insertedRows: result.affectedRows });
    } else {
      res.status(400).json({ error: 'Failed to add customer' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
///update customer details
app.put('/customers/update', async (req, res) => {
  try {
    const {
      customer_id,
      store_id,
      first_name,
      last_name,
      email,
      address_id,
      active,
    } = req.body;

    const result = await updateCustomer(customer_id, store_id, first_name, last_name, email, address_id, active);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Customer updated successfully', updatedRows: result.affectedRows });
    } else {
      res.status(400).json({ error: 'Failed to update customer' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//delete a customer based on it's id 
app.delete('/customers/delete', async (req, res) => {
  try {
    const customer_id = req.body.customer_id; // Assuming you are sending the customer_id in the request body
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }
    // Call the deleteCustomer function to delete the customer
    const result = await deleteCustomer(customer_id);

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Customer deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
//view customers rented movies 
app.get('/customers/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const customer_rented_movies = await viewCustomerMovies(id);
    return res.send(customer_rented_movies);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while fetching customer data.' });
  }
});

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
