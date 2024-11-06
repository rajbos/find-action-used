const yaml = require("js-yaml");

function parseYamlFile(content) {
  const doc = yaml.load(content);
  const actions = [];

  for (const job of Object.values(doc.jobs)) {
    for (const step of job.steps) {
      if (
        step.uses &&
        (step.uses.includes("actions/download-artifact") ||
          step.uses.includes("actions/upload-artifact"))
      ) {
        const version = step.uses.split("@")[1];
        actions.push({ action: step.uses, version });
      }
    }
  }

  return actions;
}

module.exports = {
  parseYamlFile,
};
