export class World {
  constructor() {
    this.entities = 0;
    this.components = {};
    // this.components[componentName][entityId] = dataObject
  }

  createEntity() {
    return this.entities++;
  }

  addComponent(entityId, componentName, data) {
    if (!this.components[componentName]) {
      this.components[componentName] = {};
    }
    this.components[componentName][entityId] = data;
    return this;
  }

  getComponent(entityId, componentName) {
    return this.components[componentName] ? this.components[componentName][entityId] : undefined;
  }

  removeComponent(entityId, componentName) {
    if (this.components[componentName]) {
      delete this.components[componentName][entityId];
    }
  }

  hasComponent(entityId, componentName) {
    return this.components[componentName] && this.components[componentName][entityId] !== undefined;
  }

  getEntitiesWith(...componentNames) {
    if (componentNames.length === 0) return [];
    
    const firstComp = this.components[componentNames[0]];
    if (!firstComp) return [];
    
    const results = [];
    for (const entityId of Object.keys(firstComp)) {
      let hasAll = true;
      for (let i = 1; i < componentNames.length; i++) {
        if (!this.hasComponent(entityId, componentNames[i])) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        results.push(parseInt(entityId));
      }
    }
    return results;
  }

  destroyEntity(entityId) {
    for (const compName in this.components) {
      delete this.components[compName][entityId];
    }
  }

  saveState() {
    // Fast clone of component arrays for pathfinding
    const state = {};
    for (const [compName, entityMap] of Object.entries(this.components)) {
      state[compName] = {};
      for (const [eId, data] of Object.entries(entityMap)) {
        state[compName][eId] = { ...data };
      }
    }
    return state;
  }

  restoreState(state) {
    this.components = {};
    for (const [compName, entityMap] of Object.entries(state)) {
      this.components[compName] = {};
      for (const [eId, data] of Object.entries(entityMap)) {
        this.components[compName][eId] = { ...data };
      }
    }
  }
}
