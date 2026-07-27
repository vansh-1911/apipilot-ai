import { parseOpenApiSpec } from "./src/services/openapi-parser";

async function runTests() {
  console.log("🚀 Starting OpenAPI Parser Tests...\n");

  const testSpecs = [
    {
      name: "OpenAPI 3.0 JSON (Petstore)",
      content: {
        openapi: "3.0.0",
        info: { title: "Petstore", version: "1.0.1", description: "A sample API" },
        paths: {
          "/pets": {
            get: { summary: "List pets", tags: ["pets"], operationId: "listPets", responses: { "200": { description: "OK" } } },
            post: { summary: "Create pet", tags: ["pets"], responses: { "201": { description: "Created" } } }
          },
          "/pets/{id}": {
            get: { summary: "Get pet", tags: ["pets"], responses: { "200": { description: "OK" } } }
          }
        },
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer" }
          }
        }
      }
    },
    {
      name: "Swagger 2.0 JSON",
      content: {
        swagger: "2.0",
        info: { title: "Legacy API", version: "v2" },
        host: "api.example.com",
        basePath: "/v2",
        schemes: ["https"],
        paths: {
          "/users": {
            get: { summary: "Get users", responses: { "200": { description: "OK" } } }
          }
        },
        securityDefinitions: {
          api_key: { type: "apiKey", name: "api_key", in: "header" }
        }
      }
    }
  ];

  for (const spec of testSpecs) {
    try {
      const metadata = await parseOpenApiSpec(spec.content);
      console.log(`✅ ${spec.name}`);
      console.log(`   Title: ${metadata.title}`);
      console.log(`   Endpoints: ${metadata.endpointCount}`);
      console.log(`   Auth: ${metadata.authType}`);
      console.log(`   OpenAPI: ${metadata.openapiVersion}`);
      console.log(`   Servers: ${metadata.servers.join(", ")}`);
      
      if (spec.name.includes("Petstore")) {
        const expectedCount = 3;
        if (metadata.endpointCount !== expectedCount) {
          console.log(`❌ Failed endpoint count: Expected ${expectedCount}, got ${metadata.endpointCount}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${spec.name} failed:`, error);
    }
    console.log("");
  }
}

runTests().catch(console.error);
