The repository includes a working Next.js Course Catalog example:

cd examples/cmsjumpstart-course-catalog

Create a local environment file:

cp .env.example .env.local

Configure the required environment variables with a reachable Drupal installation and valid credentials.

Important

The Course Catalog example fetches live Drupal content while Next.js builds the application.

You must provide a reachable Drupal JSON:API endpoint and valid authentication credentials before running:

pnpm build

Using placeholder values such as https://your-drupal-site.example will cause the build to fail because the example attempts to retrieve real Drupal content during prerendering.

Start the development server:

pnpm dev

The example application will start on:

http://localhost:3000
Environment Variables

The Course Catalog example requires the following environment variables:

Variable	Purpose
DRUPAL_BASE_URL	Base URL of the Drupal installation
HTAUTH_U	HTTP Basic Authentication username
HTAUTH_P	HTTP Basic Authentication password
CONSUMERUUID	API gateway consumer identifier
UP_API_KEY	API gateway key
CMSJUMPSTART_REVALIDATION_SECRET	Secret used by the revalidation endpoint
CMSJUMPSTART_PREVIEW_SECRET	Secret used by the preview endpoint

Example:

DRUPAL_BASE_URL=https://your-drupal-site.example
HTAUTH_U=your-username
HTAUTH_P=your-password
CONSUMERUUID=your-consumer-id
UP_API_KEY=your-api-key
CMSJUMPSTART_REVALIDATION_SECRET=your-revalidation-secret
CMSJUMPSTART_PREVIEW_SECRET=your-preview-secret

Authentication values and application secrets should never be committed to the repository.

The repository's .gitignore excludes local environment files while allowing .env.example to be committed.

Drupal Requirements

The Course Catalog example expects a Drupal installation with JSON:API enabled.

The example currently retrieves Drupal course nodes through:

/jsonapi/node/course

CMSJumpstart represents this resource as:

node--course
Course Fields

The example uses the following Drupal fields:

title
field_course_code
field_credits
field_meeting_days
field_start_time
field_end_time
field_description
field_department
field_instructor
field_location
field_prerequisites

The example also uses the following relationships:

field_department — to-one relationship
field_instructor — to-one relationship
field_location — to-one relationship
field_prerequisites — to-many relationship

The example demonstrates how CMSJumpstart can retrieve Drupal resources together with included relationship resources and expose those relationships through typed application code.

Authentication

The current example uses:

HTTP Basic Authentication
X-Consumer-ID
api-key

These values are supplied through environment variables.

The Drupal package also supports other authentication configurations and custom request headers.

Course Catalog Example

The Course Catalog demonstrates the complete CMSJumpstart request flow:

Drupal
   |
   | Drupal JSON:API
   v
CMSJumpstart
   |
   | Typed Drupal resource
   | Relationships
   | Included resources
   | Query builder
   v
Next.js
   |
   v
Course Catalog

The example includes:

A Drupal-backed course listing
Typed course attributes
Typed relationship definitions
Department, instructor, and location relationships
Course prerequisites
Individual course detail pages
Drupal JSON:API field selection
Included relationship resources
Sorting
Result limits
Next.js caching
Preview mode using Drupal working-copy content
Revalidation support
Error handling
Loading states
Accessible semantic HTML
React Aria Components for interactive client-side UI
Course Listing

The course listing demonstrates a query similar to:

const response = await client
  .resource("node--course")
  .fields(
    "title",
    "field_course_code",
    "field_credits",
    "field_meeting_days",
    "field_start_time",
    "field_end_time",
    "field_department",
    "field_instructor",
    "field_location"
  )
  .include(
    "field_department",
    "field_instructor",
    "field_location"
  )
  .sort("field_course_code")
  .limit(5)
  .get();

The resulting resources can then be consumed through typed CMSJumpstart response objects rather than manually parsing the raw JSON:API response.

Course Details

Individual courses are available through:

/courses/[id]

The course detail page demonstrates:

Typed resource attributes
Included relationship resources
To-many prerequisite relationships
Course descriptions
Preview mode
Next.js loading states
Not-found handling

Prerequisites are represented as linked course resources, allowing the example to demonstrate relationships between Drupal content entities.

Preview Mode

The example includes a preview endpoint:

/preview

The endpoint enables Next.js draft mode using the configured:

CMSJUMPSTART_PREVIEW_SECRET

Preview requests use Drupal's working-copy resource version:

rel:working-copy

This allows the example to retrieve unpublished or working-copy Drupal content when preview mode is enabled.

The preview implementation is intentionally small and is designed to demonstrate how CMSJumpstart can integrate with Next.js draft mode.

Revalidation

The example also includes a revalidation endpoint:

/api/revalidate

The endpoint uses:

CMSJUMPSTART_REVALIDATION_SECRET

to authenticate revalidation requests.

CMSJumpstart generates resource cache tags based on Drupal resource types and resource IDs. These tags can be invalidated when Drupal content changes.

For example, a course collection can use:

cmsjumpstart:drupal:node--course

while an individual course can use:

cmsjumpstart:drupal:node--course:<id>

This allows Next.js cache invalidation to target Drupal resources without requiring application code to manually manage individual cache entries.

Architecture

CMSJumpstart separates CMS querying from request execution and framework integration.

The current high-level architecture is:

Next.js Application
        |
        v
@cmsjumpstart/next
        |
        v
NextCMSClient
        |
        v
DrupalClient
        |
        v
DrupalResource
        |
        v
DrupalQueryBuilder
        |
        v
DrupalQuerySerializer
        |
        v
RequestExecutor
        |
        v
Drupal JSON:API

The Next.js integration remains intentionally thin.

Drupal-specific behavior stays in the Drupal package rather than being duplicated inside the Next.js integration.

The Next.js integration adds framework-specific request and caching behavior while continuing to use the Drupal package for CMS communication.

Querying Drupal

A basic Drupal resource query looks like:

const courses = await client
  .resource("node--course")
  .fields(
    "title",
    "field_course_code",
    "field_credits"
  )
  .sort("field_course_code")
  .limit(5)
  .get();

Queries support fluent composition for common Drupal JSON:API operations including:

Field selection
Sparse fieldsets
Includes
Filtering
Sorting
Pagination
Result limits
Resource versions

For example:

const courses = await client
  .resource("node--course")
  .include(
    "field_department",
    "field_instructor"
  )
  .filter(
    "field_credits",
    ">=",
    3
  )
  .sort("field_course_code")
  .limit(10)
  .get();

Supported filter operators include Drupal JSON:API operators such as:

=
<>
>
>=
<
<=
STARTS_WITH
CONTAINS
ENDS_WITH
IN
NOT IN
BETWEEN
NOT BETWEEN
IS NULL
IS NOT NULL

The query builder is designed around Drupal JSON:API behavior rather than attempting to provide a generic database query abstraction.

Responses

CMSJumpstart provides typed response and resource abstractions around Drupal JSON:API responses.

Responses support:

Individual resources
Resource collections
Typed attributes
Relationship data
Included resources
Typed included resources
Pagination
Response-oriented navigation
Raw JSON:API response access

For example:

const course = response.getOne();

const courses = response.getAll();

const department =
  course?.includedResource(
    "field_department"
  );

const prerequisites =
  course?.includedResources(
    "field_prerequisites"
  );

The goal is to allow application code to work with typed CMS content without manually traversing raw JSON:API response structures.

Next.js Integration

The @cmsjumpstart/next package provides Next.js-specific integration around the Drupal package.

It currently includes:

createNextCMS
NextCMSClient
NextCMSResource
Next.js request execution
Next.js cache integration
Resource cache tags
Revalidation helpers
Revalidation route handlers
Preview route handlers

The integration allows application code to continue using the CMSJumpstart resource/query API while the request layer handles Next.js-specific behavior such as caching and revalidation.

Styling

The Course Catalog example uses Tailwind CSS v4 with the official PostCSS integration.

No legacy tailwind.config.js file is required for the current example configuration.

Custom styling and design tokens can be added through the application's CSS as the example evolves.

Development

From the repository root:

pnpm install

Run the complete test suite:

pnpm test

Build all packages:

pnpm build

Run the Course Catalog example:

pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog dev

Typecheck the Course Catalog example:

pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog typecheck

Build the Course Catalog example:

pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog build

Start the production build:

pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog start
Testing and Validation

Before considering a change complete, validate the repository with:

pnpm test
pnpm build

When changes affect the Course Catalog example, also run:

pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog typecheck

and:

pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog build

For changes affecting the example application, run the development server and verify the application in a browser:

pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog dev

Then open:

http://localhost:3000

The example requires a reachable Drupal installation and valid environment variables.

Project Structure
packages/
  core/
  drupal/
  next/

examples/
  cmsjumpstart-course-catalog/
    app/
      api/
        revalidate/
          route.ts
      components/
        CourseList.tsx
      courses/
        [id]/
          page.tsx
      lib/
        cms.ts
        courses.ts
      preview/
        route.ts
      error.tsx
      globals.css
      layout.tsx
      loading.tsx
      page.tsx
    .env.example
    next.config.ts
    package.json
    postcss.config.mjs
    tsconfig.json

rfcs/

Generated files such as .next, node_modules, next-env.d.ts, and TypeScript build information are intentionally excluded from version control.

RFCs

Architectural decisions and proposed changes are documented in the rfcs/ directory.

RFCs are used to document:

Architectural decisions
Public API design
Query behavior
Request execution
Authentication
Future features

Because CMSJumpstart is still under active development, RFCs marked Proposed may describe future architecture rather than currently implemented functionality.

Current Limitations

CMSJumpstart is still under active development.

The following should be considered before using the project in production:

Public APIs may change before the first stable release.
The current example is focused on Drupal JSON:API.
The authentication example reflects the current Drupal API gateway requirements.
Advanced request features such as retries, middleware, and logging are not currently part of the request execution API.
The project currently provides a focused Next.js integration rather than a complete application framework.
The Course Catalog example expects a Drupal environment that exposes the required content types, fields, relationships, and authentication configuration.

These limitations are expected to evolve as the project moves toward its first stable release.

Contributing

CMSJumpstart is currently in active development.

Before contributing significant architectural changes:

Review the relevant RFCs.
Review the existing package implementation.
Run the repository test suite.
Run the package build.
Typecheck and build the Course Catalog example when changes affect it.

For larger architectural changes, document the proposed design in an RFC before implementation.

License

MIT