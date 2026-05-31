/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: null,
      deleteRule: null,
      fields: [
        {
          autogeneratePattern: "[a-z0-9]{15}",
          hidden: false,
          id: "text3208210256",
          max: 15,
          min: 15,
          name: "id",
          pattern: "^[a-z0-9]+$",
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: "text",
        },
        {
          autogeneratePattern: "",
          hidden: false,
          id: "text1928379451",
          max: 0,
          min: 0,
          name: "emoji",
          pattern: "",
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: "text",
        },
        {
          autogeneratePattern: "",
          hidden: false,
          id: "text2837465190",
          max: 0,
          min: 0,
          name: "reaction",
          pattern: "",
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: "text",
        },
        {
          hidden: false,
          id: "autodate2990389176",
          name: "created",
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: "autodate",
        },
        {
          hidden: false,
          id: "autodate3332085495",
          name: "updated",
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: "autodate",
        },
      ],
      id: "pbc_standard_reactions",
      indexes: [],
      listRule: "@request.auth.id != ''",
      name: "mb_standard_message_reactions",
      system: false,
      type: "base",
      updateRule: null,
      viewRule: "@request.auth.id != ''",
    });

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_standard_reactions");

    return app.delete(collection);
  },
);
