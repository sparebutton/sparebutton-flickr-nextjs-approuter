# SPAREBUTTON - Flickr + Next.js SSG

## Overview

This is a Next.js project for **SPAREBUTTON (https://www.sparebutton.jp)**, using the Flickr API to fetch and display albums from a specific Flickr collection in a fully static site manner. It’s deployed on Vercel.

### Features

-   **Flickr Collection**:  
    https://www.flickr.com/photos/sparebutton/collections/72157648570602034/
-   **Static Site Generation (SSG)**: Builds album data at compile time
-   **Deployed on Vercel**: GitHub integration
-   **TypeScript** support

### Environment Variables

Set the following environment variables (in Vercel Project Settings or .env):

```
NUXT_PUBLIC_FLICKR_API_KEY=xxxxxxx
NUXT_PUBLIC_FLICKR_USER_ID=xxxxxxx
NUXT_PUBLIC_FLICKR_COLLECTION_ID=xxxxxxx
```

### Setup & Development

```
# Install dependencies
yarn install

# Run locally
yarn dev
# Visit http://localhost:3000

# Production build (SSG)
yarn build
yarn start
```

### Deployment

Simply create a Vercel project from this repo, configure environment variables, and click Deploy!

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
