
const babelParser = require('@babel/parser');
const babelTraverse = require('@babel/traverse').default;
const babelTypes = require('@babel/types');
const babel = require('@babel/core');
const prettier = require('prettier');

function convert_angular_to_react(angularCode) {
  // Parse the Angular code into an AST
  const angularAst = babelParser.parse(angularCode, {
    sourceType: 'module',
    plugins: ['typescript', 'decorators', 'jsx'],
  });


  // Create a new AST for the React code
  const reactAst = babelTypes.program([]);
  // Define the AngularToReactTransformer
  const AngularToReactTransformer = {
    AngularClass(path) {
      const className = path.node.id.name;

      // Convert the Angular class into a function component
      const component = babelTypes.functionDeclaration(
        babelTypes.identifier(className),
        [babelTypes.identifier('props')],
        babelTypes.blockStatement(path.node.body.body.map(x => AngularToReactTransformer.AngularClassMethod(x)).filter(x => !!x))
      );

      // Add the component to the React AST
      reactAst.body.push(component);

      // Remove the Angular class from the Angular AST
      path.remove();
    },

    AngularClassMethod(node) {
      if (node.key.name !== 'constructor' && node.type === 'ClassMethod') {
        // Convert the Angular class method into a function declaration
        const declaration = babelTypes.functionDeclaration(
          babelTypes.identifier(node.key.name),
          node.params,
          node.body
        );

        // Replace all references to 'this' with 'props'
        babelTraverse(node.body, {
          ThisExpression(thisPath) {
            thisPath.replaceWith(babelTypes.identifier('props'));
          },
        }, {}, {}, {});

        return declaration;
      } else if (node.type === 'ClassProperty' && node.value.type === 'ArrowFunctionExpression') {
        // Convert the Angular class method into a function declaration
        const declaration = babelTypes.functionDeclaration(
          babelTypes.identifier(node.key.name),
          node.value.params,
          node.value.body
        );

        // Replace all references to 'this' with 'props'
        babelTraverse(node.body, {
          ThisExpression(thisPath) {
            thisPath.replaceWith(babelTypes.identifier('props'));
          },
        }, {}, {}, {});

        return declaration;
      } else if (node.type === 'ClassProperty' && node.value.callee.name === 'BehaviorSubject') {
        const propertyName = node.key.name;
        const initialValue = node.value.arguments[0];
        const [hookName, hookSetterName] = this.getHookNames(propertyName);

        const useStateDeclaration = babelTypes.variableDeclaration('const', [
          babelTypes.variableDeclarator(
            babelTypes.arrayPattern([
              babelTypes.identifier(hookName),
              babelTypes.identifier(hookSetterName),
            ]),
            babelTypes.callExpression(babelTypes.identifier('React.useState'), [
              initialValue ? babelTypes.cloneNode(initialValue) : babelTypes.identifier('undefined'),
            ])
          ),
        ]);
        return useStateDeclaration;
      } else if (node.type === 'ClassProperty') {
        const propertyName = node.key.name;
        const initialValue = node.value;
        const [hookName, hookSetterName] = this.getHookNames(propertyName);

        const useStateDeclaration = babelTypes.variableDeclaration('const', [
          babelTypes.variableDeclarator(
            babelTypes.arrayPattern([
              babelTypes.identifier(hookName),
              babelTypes.identifier(hookSetterName),
            ]),
            babelTypes.callExpression(babelTypes.identifier('React.useState'), [
              initialValue ? babelTypes.cloneNode(initialValue) : babelTypes.identifier('undefined'),
            ])
          ),
        ]);

        return useStateDeclaration;

      }
      return
    },

    getHookNames(propertyName) {
      const hookName = propertyName;
      const hookSetterName = 'set' + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
      return [hookName, hookSetterName];
    },
  };
 
  // Traverse the Angular AST and transform it into the React AST
  babelTraverse(angularAst, {
    ClassDeclaration(path) {
      const angularClassDecorator = path.node.decorators.find(
        (decorator) => decorator.expression.callee.name === 'Component'
      );

      if (angularClassDecorator) {
        AngularToReactTransformer.AngularClass(path);
      }
    },
  });

  // // Generate the React code from the AST
  const { code } = babel.transformFromAstSync(babelTypes.program(reactAst.body), null, {
    presets: ['@babel/preset-react'],
    retainLines: true,
  })
  const formattedReactCode = prettier.format(code, { parser: 'babel' });

  return formattedReactCode;
}


const fs = require('fs');

fs.readFile('angular.ts', 'utf-8', (err, data) => {
  if (err) throw err;
  const result = convert_angular_to_react(data)
  console.log(result)
  // console.log(convert_angular_to_react(data));
});


