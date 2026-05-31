/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_2087337339");

    // update collection data
    unmarshal(
      {
        name: "bs_correspondence_topics",
      },
      collection,
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_2087337339");

    // update collection data
    unmarshal(
      {
        name: "bs_correspondence_topics",
      },
      collection,
    );

    return app.save(collection);
  },
);
