/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add a new UID column to Mtable and RBSA for tracking from the origin
  pgm.addColumns("Mtable", {
    r_bsa_uid: { type: "varchar(255)", notNull: false }, // Allow null for existing data
  });
  pgm.addColumns("RBSA", {
    r_bsa_uid: { type: "varchar(255)", notNull: false }, // Allow null for existing data
  });

  // Drop the old integer-based array column from C to replace it with a UID-based one
  pgm.dropColumns("C", "r_bsa_ids", { ifExists: true });

  // Add the new string-based array column to C, keeping the original name for consistency
  pgm.addColumns("C", {
    r_bsa_ids: {
      type: "varchar(255)[]",
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  // Revert C table changes: drop the new UID-based column and restore the old integer-based one
  pgm.dropColumns("C", "r_bsa_ids");
  pgm.addColumns("C", {
    r_bsa_ids: {
      type: "INTEGER[]",
      notNull: false,
    },
  });

  // Revert Mtable and RBSA changes by dropping the UID column
  pgm.dropColumns("RBSA", "r_bsa_uid");
  pgm.dropColumns("Mtable", "r_bsa_uid");
};
