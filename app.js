const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())
let db = null
const dbPath = path.join(__dirname, 'moviesData.db')

const port = 3000

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`)
    })
  } catch (error) {
    console.log(error.message)
  }
}

initializeDbAndServer()

//Returns a list of all movie names in the movie table
app.get('/movies/', async (request, response) => {
  try {
    const getMoviesQuery = `select movie_name from movie`
    const moviesArray = await db.all(getMoviesQuery)
    const formatedMoviesArray = moviesArray.map(each => ({
      movieName: each.movie_name,
    }))
    response.send(formatedMoviesArray)
  } catch (error) {
    console.log(`Failed while Fetching movies: ${error}`)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

//Creates a new movie in the movie table. movie_id is auto-incremented
app.post('/movies/', async (request, response) => {
  try {
    const movieDetails = request.body
    const {directorId, movieName, leadActor} = movieDetails
    const addMovieQuery = `insert into movie(director_id,movie_name,lead_actor) values(?,?,?)`
    await db.run(addMovieQuery, [directorId, movieName, leadActor])
    response.send('Movie Successfully Added').status(201)
  } catch (error) {
    console.log(`Error While Adding Movie: ${error}`)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

//Returns a movie based on the movie ID
app.get('/movies/:movieId/', async (request, response) => {
  try {
    const {movieId} = request.params
    const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ?`

    const movie = await db.get(getMovieQuery, [movieId])

    if (movie) {
      const formattedMovie = {
        movieId: movie.movie_id,
        directorId: movie.director_id,
        movieName: movie.movie_name,
        leadActor: movie.lead_actor,
      }
      response.send(formattedMovie)
    } else {
      response.status(404).send({message: 'Movie not found'})
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

//Updates the details of a movie in the movie table based on the movie ID
app.put('/movies/:movieId', async (request, response) => {
  try {
    const {movieId} = request.params
    const movieDetails = request.body
    const {directorId, movieName, leadActor} = movieDetails
    const updateMovieQuery = `update movie set director_id=?,movie_name=?,lead_actor=? where movie_id=?`
    const result = await db.run(updateMovieQuery, [
      directorId,
      movieName,
      leadActor,
      movieId,
    ])
    if (result.changes > 0) {
      response.send('Movie Details Updated')
    } else {
      response.status(400).send({error: 'Movie not found'})
    }
  } catch (error) {
    console.error('Error updating movie:', error)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

//Deletes a movie from the movie table based on the movie ID
app.delete('/movies/:movieId/', async (request, response) => {
  try {
    const {movieId} = request.params
    const deleteMovieQuery = `delete from movie where movie_id=?`
    const result = await db.run(deleteMovieQuery, [movieId])

    // Check if the deletion was successful (result.changes gives the number of affected rows)
    if (result.changes > 0) {
      response.send('Movie Removed')
    } else {
      response.status(404).send({error: 'Movie not found'})
    }
  } catch (error) {
    console.log(`Error deleting movie: ${error}`)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

//Returns a list of all directors in the director table
app.get('/directors/', async (request, response) => {
  try {
    const getDirectorsQuery = `select * from director`
    const directors = await db.all(getDirectorsQuery)
    const formattedDirectors = directors.map(each => ({
      directorId: each.director_id,
      directorName: each.director_name,
    }))
    response.send(formattedDirectors)
  } catch (error) {
    console.log(`Failed to fetch Directors: ${error}`)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

//Returns a list of all movie names directed by a specific director

app.get('/directors/:directorId/movies/', async (request, response) => {
  try {
    const {directorId} = request.params
    const getDirectorMoviesQuery = `select movie_name from movie where director_id=?`
    const movies = await db.all(getDirectorMoviesQuery, [directorId])
    if (movies.length > 0) {
      const formattedMovies = movies.map(each => ({
        movieName: each.movie_name,
      }))
      response.status(200).send(formattedMovies)
    } else {
      response.status(404).send({error: 'No Movies Found for this Director'})
    }
  } catch (error) {
    console.log(`Error while fetching director's Movies: ${error}`)
    response.status(500).send({error: 'Internal Server error'})
  }
})

module.exports = app
