# NestJS Boilerplate - Under Active Development 🚧

This is a NestJS boilerplate project designed to provide a solid foundation for building scalable and maintainable server-side applications. It includes several pre-configured modules and utilities to streamline development.

**Important: This boilerplate is currently under active development. More features and improvements will be added in the future. 🚀**

## Key Features Available ✨

- **NestJS**: A progressive Node.js framework.
- **TypeScript**: Static typing for enhanced code quality.
- **MikroORM**: A TypeScript ORM for PostgreSQL.
- **PostgreSQL**: A powerful relational database. 🐘
- **BullMQ**: A Redis-based queue system.
- **Redis**: In-memory data structure store for queue management.
- **Swagger**: API documentation. 📝
- **JWT Authentication**: User and admin authentication. 🔑
- **Configuration**: Centralized configuration via `.env` files. ⚙️
- **Validation**: Request validation using `class-validator`. ✅
- **Docker**: Docker and Docker Compose files for easy deployment. 🐳

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd nestjs-boilerplate
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**

    - Create a `.env` file in the root directory.
    - Populate the `.env` file with the necessary environment variables (database, Redis, JWT secrets, etc.). See `.env.example` for a template.

4.  **Start the Docker containers (optional):**

    ```bash
    docker-compose up -d
    ```

5.  **Build the project:**

    ```bash
    npm run build
    ```

6.  **Start the application:**

    ```bash
    npm run start:dev
    ```

## Usage

- **API Documentation**: Access the Swagger UI at `/docs` (path configurable via `.env`).
- **Queue Management**: Access the BullBoard UI at `/queues` (only in development).

## Contributing

Contributions are welcome! Please note that the project is actively evolving. 🤝
