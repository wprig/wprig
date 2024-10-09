// Basic example to ensure TypeScript is working

// An interface to define the structure of a User object
interface User {
	id: number;
	name: string;
	email: string;
}

// A function that takes a User and returns a greeting message
function greet(user: User): string {
	return `Hello, ${user.name}! Welcome to the TypeScript world.`;
}

// Creating a User object
const user: User = {
	id: 1,
	name: 'John Doe',
	email: 'john.doe@example.com'
};

// Logging the greeting message to the console
console.log(greet(user));

// A class to demonstrate more advanced features
class Person {
	private firstName: string;
	private lastName: string;

	constructor(firstName: string, lastName: string) {
		this.firstName = firstName;
		this.lastName = lastName;
	}

	getFullName(): string {
		return `${this.firstName} ${this.lastName}`;
	}
}

// Instantiating a new Person object
const person = new Person('Jane', 'Smith');

// Logging the full name of the person to the console
console.log(`Full Name: ${person.getFullName()}`);
