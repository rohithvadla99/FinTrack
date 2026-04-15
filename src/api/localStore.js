// Local storage-based entity store — drop-in replacement for @base44/sdk entities

const PREFIX = 'fintrack_';

function getAll(entityName) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + entityName) || '[]');
  } catch {
    return [];
  }
}

function saveAll(entityName, items) {
  localStorage.setItem(PREFIX + entityName, JSON.stringify(items));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createEntityClient(entityName) {
  return {
    list(sortField = '-date', limit = 500) {
      let items = getAll(entityName);
      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        items = [...items].sort((a, b) => {
          const av = a[field] ?? '';
          const bv = b[field] ?? '';
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return desc ? -cmp : cmp;
        });
      }
      return Promise.resolve(items.slice(0, limit));
    },

    get(id) {
      const items = getAll(entityName);
      const item = items.find(i => i.id === id);
      return item ? Promise.resolve(item) : Promise.reject(new Error('Not found'));
    },

    create(data) {
      const items = getAll(entityName);
      const newItem = { ...data, id: genId(), created_date: new Date().toISOString() };
      items.push(newItem);
      saveAll(entityName, items);
      return Promise.resolve(newItem);
    },

    update(id, data) {
      const items = getAll(entityName);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return Promise.reject(new Error('Not found'));
      items[idx] = { ...items[idx], ...data };
      saveAll(entityName, items);
      return Promise.resolve(items[idx]);
    },

    delete(id) {
      const items = getAll(entityName);
      saveAll(entityName, items.filter(i => i.id !== id));
      return Promise.resolve({ id });
    },

    filter(filters = {}, sortField, limit) {
      return this.list(sortField, limit).then(items =>
        items.filter(item =>
          Object.entries(filters).every(([k, v]) => item[k] === v)
        )
      );
    }
  };
}

export const localStore = {
  entities: new Proxy({}, {
    get(_, entityName) {
      return createEntityClient(entityName);
    }
  }),
  auth: {
    me: () => Promise.resolve({ id: 'local-user', email: 'local@fintrack.app', full_name: 'Local User' }),
    logout: () => {},
    redirectToLogin: () => {},
  }
};
