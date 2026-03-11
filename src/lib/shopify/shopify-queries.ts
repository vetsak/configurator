export const PRODUCTS_BY_COLLECTION_QUERY = `
  query ProductsByCollection($handle: String!, $first: Int = 50, $after: String) {
    collectionByHandle(handle: $handle) {
      title
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            tags
            productType
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
            metafields(identifiers: [
              { namespace: "custom", key: "fabric_type" },
              { namespace: "custom", key: "color_name" },
              { namespace: "custom", key: "swatch_image" },
              { namespace: "custom", key: "module_size" }
            ]) {
              key
              value
              namespace
            }
          }
        }
      }
    }
  }
`;

export const PRODUCTS_BY_TAG_QUERY = `
  query ProductsByTag($query: String!, $first: Int = 50, $after: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          tags
          productType
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "fabric_type" },
            { namespace: "custom", key: "color_name" },
            { namespace: "custom", key: "swatch_image" },
            { namespace: "custom", key: "module_size" }
          ]) {
            key
            value
            namespace
          }
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int = 20) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
        }
      }
    }
  }
`;
