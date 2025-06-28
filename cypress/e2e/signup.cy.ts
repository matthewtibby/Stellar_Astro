/// <reference types="cypress" />

describe('Signup Page', () => {
  it('should redirect to login after signup for unauthenticated users', () => {
    cy.visit('/signup');
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type('testuser+signup@example.com');
    cy.get('input[name="password"]').type('SuperSecret123!');
    cy.get('input[name="confirmPassword"]').type('SuperSecret123!');
    cy.get('form').submit();
    cy.url().should('include', '/login?redirectedFrom=%2Fdashboard');
    cy.contains(/log in|sign up|login|please/i).should('exist'); // Looks for a login prompt or error message
  });

  it('should show validation error for invalid email', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type('not-an-email');
    cy.get('input[name="password"]').type('SuperSecret123!');
    cy.get('input[name="confirmPassword"]').type('SuperSecret123!');
    cy.get('form').submit();
    cy.contains('Invalid email').should('exist');
  });

  it('should show validation error for weak password', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type('testuser+signup@example.com');
    cy.get('input[name="password"]').type('123');
    cy.get('input[name="confirmPassword"]').type('123');
    cy.get('form').submit();
    cy.contains('Password is too weak').should('exist');
  });

  it('should show validation error for mismatched passwords', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type('testuser+signup@example.com');
    cy.get('input[name="password"]').type('SuperSecret123!');
    cy.get('input[name="confirmPassword"]').type('DifferentPassword!');
    cy.get('form').submit();
    cy.contains('Passwords do not match').should('exist');
  });
}); 