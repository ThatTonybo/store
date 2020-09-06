const Store = require('./src/index');
const test = require('ava');

// creation
test.todo(`create a new store`);

// events
test.todo(`listening for 'added' single event`);
test.todo(`listening for 'added' multiple event`);
test.todo(`listening for 'edited' event`);
test.todo(`listening for 'replaced' event`);
test.todo(`listening for 'deleted' event`);
test.todo(`listening for 'emptied' event`);
test.todo(`listening for 'backupsStarted' event`);
test.todo(`listening for 'backupsStopped' event`);
test.todo(`listening for 'backup' event`);
test.todo(`listening for 'restore' event`);

// basics
test.todo(`add a single item`);
test.todo(`add multiple items`);
test.todo(`get item using id`);
test.todo(`check that an item exists using has() method`); // TODO: needs to be added
test.todo(`backup the store`);
test.todo(`filter using only() method`);
test.todo(`filter using filter() method`);
test.todo(`filter using find() method`);
test.todo(`edit an item`);
test.todo(`replace an item`);
test.todo(`empty the store`);
test.todo(`restore from a backup`);
test.todo(`delete an item`);

// advanced
test.todo(`edit an item using upsert() method (on existing item)`); // TODO: needs to be added
test.todo(`edit an item using upsert() method (on non-existent item)`); // TODO: needs to be added
test.todo(`ensure an item exists`); // TODO: needs to be added
test.todo(`sweep the store`);

// extra
test.todo(`disable scheduled backups`);
test.todo(`enable scheduled backups`);