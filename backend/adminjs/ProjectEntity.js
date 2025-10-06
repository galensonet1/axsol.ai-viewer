const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Project',
  tableName: 'projects',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    start_date: {
      type: 'date',
      nullable: true,
    },
    end_date: {
      type: 'date',
      nullable: true,
    },
    business_id: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    api_base_url: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    layout_geojson: {
      type: 'jsonb',
      nullable: true,
    },
    initial_location: {
      type: 'jsonb',
      nullable: true,
    },
  },
});
