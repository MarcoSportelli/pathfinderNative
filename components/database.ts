import 'react-native-reanimated';
import * as SQLite from 'expo-sqlite';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export const DATABASE_NAME = "db.db";

export const loadDatabase = async () => {
  const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;

  // Controlla se il database esiste già
  const dbExists = await FileSystem.getInfoAsync(dbPath);

  if (dbExists.exists) {
    // Copia il file .db dalla cartella assets alla sandbox dell'app
    console.log('Copia del database preesistente...');
    const asset = Asset.fromModule(require('../assets/mydb.db'));
    await asset.downloadAsync();

    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, {
      intermediates: true,
    });

    await FileSystem.copyAsync({
      from: asset.localUri!,
      to: dbPath,
    });
    console.log('Database copiato con successo!');
  } else {
    console.log('Database già esistente.');
  }

  // Apri il database
  const db = SQLite.openDatabaseSync(DATABASE_NAME);
  console.log('Database aperto:', DATABASE_NAME);

  return db;
};

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
    const DATABASE_VERSION = 1;
    let result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    //let currentDbVersion = result ? result.user_version : 0;
    let currentDbVersion = 0;   //TODO: cambiare usando la linea precedente quando tutti lo abbiamo fatto -> mettere a 0 se si vuol resettare il db alla versione 1
    if (currentDbVersion >= DATABASE_VERSION) {
      console.log('Database is up to date, version:', currentDbVersion);
      return;
    }
  
    if (currentDbVersion === 0) {
      console.log('Migrating to version 1');

      // Verifica transazioni attive
      let hasActiveTransaction = await db.getAllAsync(`SELECT * FROM sqlite_master WHERE type='transaction';`);

      if (hasActiveTransaction.length > 0) {
        console.log('Transactions detected, waiting for commit...');
        await db.execAsync('COMMIT;'); // Chiudi eventuali transazioni in corso
      }

      await db.execAsync(`PRAGMA journal_mode = 'wal';`);
  
      await db.execAsync(`
        PRAGMA journal_mode = 'wal';
        DROP TABLE IF EXISTS "Review";
        DROP TABLE IF EXISTS "Trail";
        DROP TABLE IF EXISTS "TrailDone";
        DROP TABLE IF EXISTS "User";
        
        CREATE TABLE Review (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trail_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES User(id),
            FOREIGN KEY (trail_id) REFERENCES Trail(id)
        );
        CREATE TABLE "Trail" (
          "id"	INTEGER NOT NULL UNIQUE,
          "name"	TEXT NOT NULL,
          "downhill"	FLOAT NOT NULL,
          "difficulty"	TEXT NOT NULL,
          "length"	FLOAT NOT NULL,
          "duration"	FLOAT NOT NULL,
          "elevation"	FLOAT NOT NULL,
          "startpoint"	JSON NOT NULL,
          "trails"	JSON NOT NULL,
          "endpoint"	JSON NOT NULL,
          "description"	TEXT,
          "image"	TEXT,
          "city"	TEXT,
          "region"	TEXT,
          "state"	TEXT,
          "province"	TEXT,
          PRIMARY KEY("id" AUTOINCREMENT)
        );
        CREATE TABLE "TrailDone" (
          "id"	INTEGER NOT NULL UNIQUE,
          "id_user"	INTEGER NOT NULL,
          "id_trail"	INTEGER NOT NULL,
          PRIMARY KEY("id" AUTOINCREMENT)
        );
        CREATE TABLE "User" (
          "id"	INTEGER NOT NULL UNIQUE,
          "name"	TEXT NOT NULL,
          "surname"	TEXT NOT NULL,
          "email"	TEXT NOT NULL UNIQUE,
          "password"	TEXT NOT NULL,
          "salt"	TEXT NOT NULL,
          PRIMARY KEY("id" AUTOINCREMENT)
        );

      `);
  
      await db.runAsync(`
        INSERT INTO "Trail" ("name", "downhill", "difficulty", "length", "duration", "elevation", "startpoint", "trails", "endpoint", "description", "image", "city", "region", "state", "province") VALUES ('Alternate Trail', '5.0', 'Intermediate', '8.0', '8.0', '5.0', '[45.464664,9.18854]', '[[45.464664,9.18854],[45.464799,9.189003],[45.464933,9.189467],[45.465067,9.189931],[45.465201,9.190395],[45.465335,9.190859],[45.46547,9.191323],[45.465604,9.191787],[45.465738,9.192251],[45.465872,9.192715],[45.466006,9.193179],[45.46614,9.193643],[45.466274,9.194107],[45.466408,9.194571],[45.466542,9.195035],[45.466676,9.195499],[45.46681,9.195963],[45.466944,9.196427],[45.467078,9.196891],[45.467212,9.197355],[45.467346,9.197819],[45.46748,9.198283]]', '[45.46748,9.198283]', 'Alternate Trail Description with different path.', 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', '', '', '', '');
        INSERT INTO "Trail" ("name", "downhill", "difficulty", "length", "duration", "elevation", "startpoint", "trails", "endpoint", "description", "image", "city", "region", "state", "province") VALUES ('Politecnico Trail', '3.0', 'Beginner', '5.0', '4.0', '3.0', '[45.062208,7.666218]', '[[45.062208,7.666218],[45.0624,7.6666],[45.062532,7.66685],[45.06264,7.66708],[45.06282,7.6674],[45.06301,7.66765],[45.06315,7.66785],[45.06325,7.668],[45.06338,7.66825],[45.06355,7.66855],[45.06368,7.6688],[45.06385,7.66905],[45.064,7.6693],[45.06412,7.66955],[45.06427,7.6698]]', '[45.06427,7.6698]', 'An easy trail starting from the Politecnico di Torino, passing through the nearby streets.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Politecnico_di_Torino_logo.svg/800px-Politecnico_di_Torino_logo.svg.png', '', '', '', '');
        INSERT INTO "Trail" ("name", "downhill", "difficulty", "length", "duration", "elevation", "startpoint", "trails", "endpoint", "description", "image", "city", "region", "state", "province") VALUES ('Advanced Politecnico Trail', '7.0', 'Advanced', '10.0', '6.0', '10.0', '[45.062208,7.666218]', '[[45.062208,7.666218],[45.06238,7.66655],[45.06252,7.6669],[45.06269,7.6672],[45.06286,7.6675],[45.06304,7.66775],[45.06315,7.66798],[45.0633,7.6682],[45.06348,7.66847],[45.0636,7.66875],[45.06378,7.66902],[45.06395,7.66931],[45.06412,7.66958],[45.06428,7.66986],[45.06444,7.67015],[45.0646,7.67042],[45.06475,7.6707],[45.06488,7.67095],[45.06504,7.67123]]', '[45.06504,7.67123]', 'A more challenging trail that starts from the Politecnico di Torino and passes through different terrains.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Politecnico_Torino_Torre_U_1.jpg/800px-Politecnico_Torino_Torre_U_1.jpg', '', '', '', '');
      `);
      await db.runAsync(`
        INSERT INTO "User" ("name", "surname", "email", "password", "salt") VALUES ('marco', 'sportelli', 'marco.sportelli@studenti.polito.it', 'cdc950af487ffa1b726e54556c37990cc10fdb1c5c0b4e93c7b633ab7527039a', '8364d528f16ac001c5724a7f245da880');
      `);
  
      await db.runAsync(`
        INSERT INTO "Review" ("user_id", "trail_id", "rating", "comment") VALUES ('1', '1', '5', 'This trail is amazing! I loved it!');
        INSERT INTO "Review" ("user_id", "trail_id", "rating", "comment") VALUES ('1', '2', '4', 'Great!');
        INSERT INTO "Review" ("user_id", "trail_id", "rating", "comment") VALUES ('2', '3', '1', 'No non lo fare o finisce male');
      `);
      await db.runAsync(`
        INSERT INTO "TrailDone" ("id_user", "id_trail") VALUES ('1', '1');
        INSERT INTO "TrailDone" ("id_user", "id_trail") VALUES ('1', '2');`
      );
  
      await loadDatabase();
  
      currentDbVersion = 1;
    }
    else if (currentDbVersion === 1) {
      console.log('Migrating to version 2');
      await loadDatabase();
      currentDbVersion = 2;
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  
    try {
      const result = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table';");
      console.log('Your Tables are:', result.map((table) => table.name));
      result.forEach((table) => {
         //se volete stampare i tipi di ogni colonna
         /*
        const columns =
          db.getAllAsync<{ name: string, type: string }>(`PRAGMA table_info(${table.name});`).then(columns => {
            console.log(`\n COLUMNS OF TABLE ${table.name}:`);
            columns.forEach(column => {
              console.log(`\t Column: ${column.name}, Type: ${column.type}`);
            });
          });
         */
        db.getAllAsync(`SELECT * FROM ${table.name};`).then(values => {
          values.forEach(value => {
            console.log(`Table ${table.name} \t Value:`, value);
          });
        });
  
  
      });
    } catch (error) {
      console.error('Error listing tables:', error);
    }
  }