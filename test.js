import request  from "supertest";
import app from "./index.js";

// add routes and pages to this list as they are added to the codebase
// this list will be used for GET page tests
const pages = [
    {route: '/', desc: 'home page'},
    {route: '/login', desc: 'login page'},
    {route: '/signUp', desc: 'sign up page'},
    {route: '/editor', desc: 'editor page'}
]

// Page Tests
pages.forEach(({route, desc}) => {
    describe(`GET ${route}`, function() {
        it(`should return ${desc}`, function(done) {
            request(app)
            .get(route)
            .expect('Content-Type',/html/)
            .expect(200)
            .end(done)
        })
    })
})

// Attempt to get nonexistent page.
describe('GET /nonexistentpage', function() {
    it('should return a 404 error', function(done) {
        request(app)
        .get('/nonexistentpage')
        .expect(404)
        .expect(res => {
            if(res.body.success !== false) 
                throw new Error('Expected success: false, got '+res.body.success);
            if(res.body.message !== 'Page Not Found') 
                throw new Error('Expected message: Page Not Found, got '+res.body.message);
        })
        .end(done)
    })
})

// Post to Sign Up (Signup Attempt)
describe('POST /signUp', function() {
    it('Valid Input', function(done) {
        request(app)
        .post('/signUp')
        .send({
            username: "testuser",
            email: "collabidetestemail@gmail.com",
            password: "testpassword"
        })
        .expect('Location', '/')
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
        .expect('Location', '/')
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