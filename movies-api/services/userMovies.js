const MongoLib = require('../lib/mongo')

class UserMoviesService {
  constructor() {
    this.collection = 'user-movies'
    this.mongoDB = new MongoLib()
  }

  async getUserMovies({ userId }) {
    const query = userId && { userId }
    const userMovies = await this.mongoDB.getAll(this.collection, query)
    return userMovies || []
  }

  async createUserMovie({ userMovie }) {
    const creatUserMovieId = await this.mongoDB.create(this.collection, userMovie)
    return creatUserMovieId
  }

  async deleteUserMovie({ userMovieId }) {
    const deleteUserMoviedId = await this.mongoDB.delete(this.collection, userMovieId)
    return deleteUserMoviedId
  }
}

module.exports = UserMoviesService

