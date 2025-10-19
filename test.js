import request  from "supertest";
import app from "index.js";

// Get Home Page
describe('GET /', function() {
    it('should return homepage.html', function(done) {
        request(app)
        .get('/')
        .expect('Content-Type',/html/)
        .expect(200)
        .end(done)
    })
})

// Get Login
describe('GET /login', function() {
    it('should return loginPage.html', function(done) {
        request(app)
        .get('/login')
        .expect('Content-Type',/html/)
        .expect(200)
        .end(done)
    })
})

// Get Sign Up
describe('GET /signUp', function() {
    it('should return signUpPage.html', function(done) {
        request(app)
        .get('/signUp')
        .expect('Content-Type',/html/)
        .expect(200)
        .end(done)
    })
})

// Get Editor
describe('GET /editor', function() {
    it('Correct page return', function(done) {
        request(app)
        .get('/editor')
        .expect('Content-Type',/html/)
        .expect(200)
        .end(done) 
    })
})

// Post to Sign Up (Signup Attempt)
describe('POST /signup', function() {
    it('Valid Input', function(done) {
        request(app)
        .post('/signUp')
        .send({
            username: "testuser",
            email: "collabidetestemail@gmail.com",
            password: "testpassword"
        })
        .expect(302, done)
    })

    // Will be set up when login functionality is complete and accounts are saved.
    // it('No Username', function(done) {
    
    // })

    // it('No Email', function(done) {

    // })

    // it('No Password', function(done) {

    // })

    // it('Registered Email', function(done) {

    // })
})


// Post to Login (Login Attempt)
describe('POST /login', function() {
    it('Valid Input', function(done) {
        request(app)
        .post('/login')
        .send({
            email: "collabidetestemail@gmail.com",
            password: "testpassword"
        })
        .expect(302, done)
    })

    // Will be set up when login functionality is complete and accounts are saved.
    // it('No Email', function(done) {

    // })

    // it('No Password', function(done) {

    // })

    // it('Unregistered Email', function(done) {

    // })

    // it('Incorrect Password', function(done) {

    // })
})

// Generic Error Handling Tests
