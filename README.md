# CMSJumpstart

CMSJumpstart is a TypeScript toolkit for building production-oriented applications with Drupal JSON:API and Next.js.

The repository includes a working Next.js Course Catalog example that demonstrates the complete flow from Drupal content through CMSJumpstart into a Next.js application.

## Quick Start

The repository includes a working Next.js Course Catalog example:

```bash
cd examples/cmsjumpstart-course-catalog
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Configure the required environment variables with a reachable Drupal installation and valid credentials.

> **Important**
>
> The Course Catalog example fetches live Drupal content while Next.js builds the application.
>
> You must provide a reachable Drupal JSON:API endpoint and valid authentication credentials before running:
>
> ```bash
> pnpm build
> ```
>
> Using placeholder values such as `https://your-drupal-site.example` will cause the build to fail because the example attempts to retrieve real Drupal content during prerendering.

### Drupal Course Catalog Fixture

The Course Catalog example requires Drupal content that matches the resource types, fields, and relationships used by the example.

A portable Drupal fixture is included with the repository:

```text
examples/cmsjumpstart-course-catalog/drupal/
├── config/
└── content/
    └── course-catalog.content.yml
```

The fixture contains:

* Four Drupal content types: `course`, `department`, `location`, and `person`
* The Course Catalog field storage and field configuration
* Sample departments, instructors, locations, and courses
* Course-to-department relationships
* Course-to-instructor relationships
* Course-to-location relationships
* Course prerequisite relationships

**The Drupal fixture must be installed/imported before running the Next.js Course Catalog example unless your Drupal installation already provides equivalent configuration and content.**

The fixture requires Drupal with the following modules available:

* Node
* Text
* Options
* Datetime Range
* JSON:API
* YAML Content

`jsonapi_extras` is not required by the fixture.

#### 1. Make the fixture available to Drupal

The `drupal/` directory is part of the CMSJumpstart repository, while your Drupal application may live in a separate repository.

Copy or otherwise make the fixture available inside your Drupal project/container. For example, with a DDEV-based Drupal project:

```bash
mkdir -p .cmsjumpstart-fixture/config .cmsjumpstart-fixture/content

cp /path/to/cmsjumpstart/examples/cmsjumpstart-course-catalog/drupal/config/*.yml \
  .cmsjumpstart-fixture/config/

cp /path/to/cmsjumpstart/examples/cmsjumpstart-course-catalog/drupal/content/course-catalog.content.yml \
  .cmsjumpstart-fixture/content/
```

The exact location can differ depending on how your Drupal project is organized. The important requirement is that Drupal can access the fixture files from inside its environment.

#### 2. Import the Drupal configuration

The fixture contains 26 Drupal configuration files.

Import them as a partial configuration set so that configuration not included in the fixture is not removed:

```bash
ddev drush config:import \
  --partial \
  --source=/var/www/html/.cmsjumpstart-fixture/config \
  -y
```

If your Drupal environment uses a different container path, replace the `--source` path with the path where you made the fixture configuration available.

The configuration includes:

* `course` content type
* `department` content type
* `location` content type
* `person` content type
* Course field storage
* Course field instances
* Entity reference relationships
* Course date and time fields
* Course meeting-day configuration

#### 3. Import the sample content

The YAML Content importer expects the directory containing the `content/` directory, rather than the `content/` directory itself.

Run:

```bash
ddev drush yaml_content:import /var/www/html/.cmsjumpstart-fixture
```

This imports the sample departments, people, locations, and courses defined in:

```text
drupal/content/course-catalog.content.yml
```

The fixture uses entity references based on entity properties such as content type and title rather than relying on database-specific node IDs.

Do not use `--create-new` for the normal fixture setup unless you intentionally want to create additional copies of existing fixture content.

#### 4. Verify Drupal JSON:API

After the configuration and content have been imported, verify that Drupal exposes the course resource:

```text
/jsonapi/node/course
```

The Course Catalog example expects the Drupal resource type:

```text
node--course
```

Your Drupal installation must also provide the authentication headers and credentials described in the [Authentication](#authentication) section.

#### 5. Configure the Next.js example

Return to the Course Catalog example:

```bash
cd examples/cmsjumpstart-course-catalog
```

Create the environment file if you have not already done so:

```bash
cp .env.example .env.local
```

Configure the required environment variables, then start the application:

```bash
pnpm dev
```

The example application will start on:

http://localhost:3000

## Environment Variables

The Course Catalog example requires the following environment variables:

| Variable                           | Purpose                                  |
| ---------------------------------- | ---------------------------------------- |
| `DRUPAL_BASE_URL`                  | Base URL of the Drupal installation      |
| `DRUPAL_USERNAME`                         | HTTP Basic Authentication username       |
| `DRUPAL_PASSWORD`                         | HTTP Basic Authentication password       |
| `CONSUMERUUID`                     | API gateway consumer identifier          |
| `UP_API_KEY`                       | API gateway key                          |
| `CMSJUMPSTART_REVALIDATION_SECRET` | Secret used by the revalidation endpoint |
| `CMSJUMPSTART_PREVIEW_SECRET`      | Secret used by the preview endpoint      |

Example:

```dotenv
DRUPAL_BASE_URL=https://your-drupal-site.example
DRUPAL_USERNAME=your-username
DRUPAL_PASSWORD=your-password
CONSUMERUUID=your-consumer-id
UP_API_KEY=your-api-key
CMSJUMPSTART_REVALIDATION_SECRET=your-revalidation-secret
CMSJUMPSTART_PREVIEW_SECRET=your-preview-secret
```

Authentication values and application secrets should never be committed to the repository.

The repository's `.gitignore` excludes local environment files while allowing `.env.example` to be committed.

## Drupal Requirements

The Course Catalog example expects a Drupal installation with JSON:API enabled.

The example currently retrieves Drupal course nodes through:

```text
/jsonapi/node/course
```

CMSJumpstart represents this resource as:

```text
node--course
```

### Course Fields

The example uses the following Drupal fields:

* `title`
* `field_course_code`
* `field_credits`
* `field_meeting_days`
* `field_start_time`
* `field_end_time`
* `field_description`
* `field_department`
* `field_instructor`
* `field_location`
* `field_prerequisites`

The example also uses the following relationships:

* `field_department` — to-one relationship
* `field_instructor` — to-one relationship
* `field_location` — to-one relationship
* `field_prerequisites` — to-many relationship

The example demonstrates how CMSJumpstart can retrieve Drupal resources together with included relationship resources and expose those relationships through typed application code.

## Authentication

The current example uses:

* HTTP Basic Authentication
* `X-Consumer-ID`
* `api-key`

These values are supplied through environment variables.

The Drupal package also supports other authentication configurations and custom request headers.

## Course Catalog Example

The Course Catalog demonstrates the complete CMSJumpstart request flow:

```text
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
```

The example includes:

* A Drupal-backed course listing
* Typed course attributes
* Typed relationship definitions
* Department, instructor, and location relationships
* Course prerequisites
* Individual course detail pages
* Drupal JSON:API field selection
* Included relationship resources
* Sorting
* Result limits
* Next.js caching
* Preview mode using Drupal working-copy content
* Revalidation support
* Error handling
* Loading states
* Accessible semantic HTML
* React Aria Components for interactive client-side UI

### Course Listing

The course listing demonstrates a query similar to:

```ts
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
```

The resulting resources can then be consumed through typed CMSJumpstart response objects rather than manually parsing the raw JSON:API response.

### Course Details

Individual courses are available through:

```text
/courses/[id]
```

The course detail page demonstrates:

* Typed resource attributes
* Included relationship resources
* To-many prerequisite relationships
* Course descriptions
* Preview mode
* Next.js loading states
* Not-found handling

Prerequisites are represented as linked course resources, allowing the example to demonstrate relationships between Drupal content entities.

### Preview Mode

The example includes a preview endpoint:

```text
/preview
```

The endpoint enables Next.js draft mode using the configured:

```text
CMSJUMPSTART_PREVIEW_SECRET
```

Preview requests use Drupal's working-copy resource version:

```text
rel:working-copy
```

This allows the example to retrieve unpublished or working-copy Drupal content when preview mode is enabled.

The preview implementation is intentionally small and is designed to demonstrate how CMSJumpstart can integrate with Next.js draft mode.

### Revalidation

The example also includes a revalidation endpoint:

```text
/api/revalidate
```

The endpoint uses:

```text
CMSJUMPSTART_REVALIDATION_SECRET
```

to authenticate revalidation requests.

CMSJumpstart generates resource cache tags based on Drupal resource types and resource IDs. These tags can be invalidated when Drupal content changes.

For example, a course collection can use:

```text
cmsjumpstart:drupal:node--course
```

while an individual course can use:

```text
cmsjumpstart:drupal:node--course:<id>
```

This allows Next.js cache invalidation to target Drupal resources without requiring application code to manually manage individual cache entries.

## Architecture

CMSJumpstart separates CMS querying from request execution and framework integration.

The current high-level architecture is:

```text
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
```

The Next.js integration remains intentionally thin.

Drupal-specific behavior stays in the Drupal package rather than being duplicated inside the Next.js integration.

The Next.js integration adds framework-specific request and caching behavior while continuing to use the Drupal package for CMS communication.

## Querying Drupal

A basic Drupal resource query looks like:

```ts
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
```

Queries support fluent composition for common Drupal JSON:API operations including:

* Field selection
* Sparse fieldsets
* Includes
* Filtering
* Sorting
* Pagination
* Result limits
* Resource versions

For example:

```ts
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
```

Supported filter operators include Drupal JSON:API operators such as:

```text
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
```

The query builder is designed around Drupal JSON:API behavior rather than attempting to provide a generic database query abstraction.

## Responses

CMSJumpstart provides typed response and resource abstractions around Drupal JSON:API responses.

Responses support:

* Individual resources
* Resource collections
* Typed attributes
* Relationship data
* Included resources
* Typed included resources
* Pagination
* Response-oriented navigation
* Raw JSON:API response access

For example:

```ts
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
```

The goal is to allow application code to work with typed CMS content without manually traversing raw JSON:API response structures.

## Next.js Integration

The `@cmsjumpstart/next` package provides Next.js-specific integration around the Drupal package.

It currently includes:

* `createNextCMS`
* `NextCMSClient`
* `NextCMSResource`
* Next.js request execution
* Next.js cache integration
* Resource cache tags
* Revalidation helpers
* Revalidation route handlers
* Preview route handlers

The integration allows application code to continue using the CMSJumpstart resource/query API while the request layer handles Next.js-specific behavior such as caching and revalidation.

## Styling

The Course Catalog example uses Tailwind CSS v4 with the official PostCSS integration.

No legacy `tailwind.config.js` file is required for the current example configuration.

Custom styling and design tokens can be added through the application's CSS as the example evolves.

## Development

From the repository root:

```bash
pnpm install
```

Run the complete test suite:

```bash
pnpm test
```

Build all packages:

```bash
pnpm build
```

Run the Course Catalog example:

```bash
pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog dev
```

Typecheck the Course Catalog example:

```bash
pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog typecheck
```

Build the Course Catalog example:

```bash
pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog build
```

Start the production build:

```bash
pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog start
```

## Testing and Validation

Before considering a change complete, validate the repository with:

```bash
pnpm test
pnpm build
```

When changes affect the Course Catalog example, also run:

```bash
pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog typecheck
```

and:

```bash
pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog build
```

For changes affecting the example application, run the development server and verify the application in a browser:

```bash
pnpm --filter @cmsjumpstart/example-cmsjumpstart-course-catalog dev
```

Then open:

http://localhost:3000

The example requires a reachable Drupal installation and valid environment variables.

## Project Structure

```text
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
    drupal/
      config/
      content/
        course-catalog.content.yml
    .env.example
    next.config.ts
    package.json
    postcss.config.mjs
    tsconfig.json

rfcs/
```

Generated files such as `.next`, `node_modules`, `next-env.d.ts`, and TypeScript build information are intentionally excluded from version control.

## RFCs

Architectural decisions and proposed changes are documented in the `rfcs/` directory.

RFCs are used to document:

* Architectural decisions
* Public API design
* Query behavior
* Request execution
* Authentication
* Future features

Because CMSJumpstart is still under active development, RFCs marked Proposed may describe future architecture rather than currently implemented functionality.

## Current Limitations

CMSJumpstart is still under active development.

The following should be considered before using the project in production:

* Public APIs may change before the first stable release.
* The current example is focused on Drupal JSON:API.
* The authentication example reflects the current Drupal API gateway requirements.
* Advanced request features such as retries, middleware, and logging are not currently part of the request execution API.
* The project currently provides a focused Next.js integration rather than a complete application framework.
* The Course Catalog example expects a Drupal environment that exposes the required content types, fields, relationships, and authentication configuration.

These limitations are expected to evolve as the project moves toward its first stable release.

## Contributing

CMSJumpstart is currently in active development.

Before contributing significant architectural changes:

1. Review the relevant RFCs.
2. Review the existing package implementation.
3. Run the repository test suite.
4. Run the package build.
5. Typecheck and build the Course Catalog example when changes affect it.

For larger architectural changes, document the proposed design in an RFC before implementation.

## License

MIT
