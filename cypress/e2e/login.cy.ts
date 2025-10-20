// cypress/e2e/login.cy.ts

describe('User Login Flow', () => {
  it('allows an admin user to log in and view the admin dashboard', () => {
    // Visit the root of the app, which should show the Auth component
    cy.visit('/');

    // Check that we are on the sign-in page
    cy.contains('h2', 'Sign In').should('be.visible');

    // Fill out the form with admin credentials
    // Note: The password can be anything because the mock service doesn't check it
    cy.get('input[id="email"]').type('admin@chorsey.com');
    cy.get('input[id="password"]').type('password123');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Assert that the user is now on the dashboard
    // We can verify this by checking for an element unique to the logged-in admin state
    cy.contains('h2', 'All Tasks').should('be.visible');
    
    // Also assert the user's name is in the header
    cy.contains('header', 'Alex').should('be.visible');
  });
});
