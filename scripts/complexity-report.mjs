import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const TARGET_FILES = [
  'src/simulation/engine.ts',
  'src/simulation/life.ts',
  'src/simulation/economy.ts',
];

function countBranches(node) {
  let count = 0;
  function visit(n) {
    if (ts.isIfStatement(n)) {
      count++;
    } else if (ts.isConditionalExpression(n)) {
      count++;
    } else if (ts.isCaseClause(n)) {
      count++;
    } else if (
      ts.isForStatement(n) ||
      ts.isForInStatement(n) ||
      ts.isForOfStatement(n) ||
      ts.isWhileStatement(n) ||
      ts.isDoStatement(n)
    ) {
      count++;
    }
    ts.forEachChild(n, visit);
  }
  visit(node);
  return count;
}

function getLineCount(sourceFile, node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
  return end - start + 1;
}

function analyzeFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Fichier introuvable : ${filePath}`);
  }

  const code = fs.readFileSync(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
  const functions = [];

  function visit(node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    ) {
      let name = '<anonymous>';
      if (node.name && ts.isIdentifier(node.name)) {
        name = node.name.text;
      } else if (
        ts.isVariableDeclaration(node.parent) &&
        ts.isIdentifier(node.parent.name)
      ) {
        name = node.parent.name.text;
      }

      if (name !== '<anonymous>') {
        const lines = getLineCount(sourceFile, node);
        const branches = countBranches(node.body || node);
        functions.push({ name, lines, branches });
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  // Trier par nombre de lignes décroissant et conserver les 3 plus longues
  functions.sort((a, b) => b.lines - a.lines);
  return functions.slice(0, 3);
}

function generateReport() {
  const rows = [];

  for (const file of TARGET_FILES) {
    const topFunctions = analyzeFile(file);
    for (const fn of topFunctions) {
      rows.push({
        file: `\`${file}\``,
        function: `\`${fn.name}\``,
        linesBefore: fn.lines,
        linesAfter: fn.lines,
        branchesBefore: fn.branches,
        branchesAfter: fn.branches,
      });
    }
  }

  console.log('| Fichier | Fonction | Lignes (avant) | Lignes (après) | Branches (avant) | Branches (après) |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    console.log(`| ${r.file} | ${r.function} | ${r.linesBefore} | ${r.linesAfter} | ${r.branchesBefore} | ${r.branchesAfter} |`);
  }
}

generateReport();
