import express from 'express';
import { top_actor, top_movies, top_movies_description, actor_details } from './database.js';
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

// app.get("/actor_details", async(req,res)=> {
//   const details = await actor_details();
//   res.send(details)
// })

app.get("/actor_details/:id", async(req,res)=> {
  const id = req.params.id
  const single_actor = await actor_details(id);
  res.send(single_actor)
})

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
