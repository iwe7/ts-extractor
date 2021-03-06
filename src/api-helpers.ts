import * as ts from "typescript";
import * as path from "path";
import { LogLevel } from "simplr-logger";

import { ApiItem, ApiItemOptions } from "./abstractions/api-item";

import { ApiItemReference } from "./contracts/api-item-reference";
import { AccessModifier } from "./contracts/access-modifier";
import { TsHelpers } from "./ts-helpers";
import { Logger } from "./utils/logger";
import { ApiItemLocationDto } from "./contracts/api-item-location-dto";

import { ApiSourceFile } from "./definitions/api-source-file";
import { ApiExport } from "./definitions/api-export";
import { ApiExportSpecifier } from "./definitions/api-export-specifier";
import { ApiImportSpecifier } from "./definitions/api-import-specifier";
import { ApiVariable } from "./definitions/api-variable";
import { ApiNamespace } from "./definitions/api-namespace";
import { ApiFunction } from "./definitions/api-function";
import { ApiEnum } from "./definitions/api-enum";
import { ApiEnumMember } from "./definitions/api-enum-member";
import { ApiInterface } from "./definitions/api-interface";
import { ApiProperty } from "./definitions/api-property";
import { ApiMethod } from "./definitions/api-method";
import { ApiParameter } from "./definitions/api-parameter";
import { ApiTypeAlias } from "./definitions/api-type-alias";
import { ApiClass } from "./definitions/api-class";
import { ApiClassConstructor } from "./definitions/api-class-constructor";
import { ApiClassProperty } from "./definitions/api-class-property";
import { ApiClassMethod } from "./definitions/api-class-method";
import { ApiGetAccessor } from "./definitions/api-get-accessor";
import { ApiSetAccessor } from "./definitions/api-set-accessor";
import { ApiIndex } from "./definitions/api-index";
import { ApiCall } from "./definitions/api-call";
import { ApiConstruct } from "./definitions/api-construct";
import { ApiTypeParameter } from "./definitions/api-type-parameter";
import { ApiTypeLiteral } from "./definitions/api-type-literal";
import { ApiFunctionExpression } from "./definitions/api-function-expression";
import { ApiMapped } from "./definitions/api-mapped";
import { PathIsInside } from "./utils/path-is-inside";

export namespace ApiHelpers {
    export function VisitApiItem(
        declaration: ts.Declaration,
        symbol: ts.Symbol,
        options: ApiItemOptions
    ): ApiItem | undefined {
        let apiItem: ApiItem | undefined;
        if (ts.isSourceFile(declaration)) {
            apiItem = new ApiSourceFile(declaration, symbol, options);
        } else if (ts.isExportDeclaration(declaration)) {
            apiItem = new ApiExport(declaration, symbol, options);
        } else if (ts.isExportSpecifier(declaration)) {
            apiItem = new ApiExportSpecifier(declaration, symbol, options);
        } else if (ts.isImportSpecifier(declaration)) {
            apiItem = new ApiImportSpecifier(declaration, symbol, options);
        } else if (ts.isVariableDeclaration(declaration)) {
            apiItem = new ApiVariable(declaration, symbol, options);
        } else if (ts.isModuleDeclaration(declaration) || ts.isNamespaceImport(declaration)) {
            apiItem = new ApiNamespace(declaration, symbol, options);
        } else if (ts.isFunctionDeclaration(declaration)) {
            apiItem = new ApiFunction(declaration, symbol, options);
        } else if (ts.isEnumDeclaration(declaration)) {
            apiItem = new ApiEnum(declaration, symbol, options);
        } else if (ts.isEnumMember(declaration)) {
            apiItem = new ApiEnumMember(declaration, symbol, options);
        } else if (ts.isInterfaceDeclaration(declaration)) {
            apiItem = new ApiInterface(declaration, symbol, options);
        } else if (ts.isPropertySignature(declaration) || ts.isPropertyAssignment(declaration)) {
            apiItem = new ApiProperty(declaration, symbol, options);
        } else if (ts.isMethodSignature(declaration)) {
            apiItem = new ApiMethod(declaration, symbol, options);
        } else if (ts.isParameter(declaration)) {
            apiItem = new ApiParameter(declaration, symbol, options);
        } else if (ts.isTypeAliasDeclaration(declaration)) {
            apiItem = new ApiTypeAlias(declaration, symbol, options);
        } else if (ts.isClassDeclaration(declaration)) {
            apiItem = new ApiClass(declaration, symbol, options);
        } else if (ts.isConstructorDeclaration(declaration)) {
            apiItem = new ApiClassConstructor(declaration, symbol, options);
        } else if (ts.isPropertyDeclaration(declaration)) {
            apiItem = new ApiClassProperty(declaration, symbol, options);
        } else if (ts.isMethodDeclaration(declaration)) {
            apiItem = new ApiClassMethod(declaration, symbol, options);
        } else if (ts.isGetAccessorDeclaration(declaration)) {
            apiItem = new ApiGetAccessor(declaration, symbol, options);
        } else if (ts.isSetAccessorDeclaration(declaration)) {
            apiItem = new ApiSetAccessor(declaration, symbol, options);
        } else if (ts.isIndexSignatureDeclaration(declaration)) {
            apiItem = new ApiIndex(declaration, symbol, options);
        } else if (ts.isCallSignatureDeclaration(declaration)) {
            apiItem = new ApiCall(declaration, symbol, options);
        } else if (ts.isConstructSignatureDeclaration(declaration) || ts.isConstructorTypeNode(declaration)) {
            apiItem = new ApiConstruct(declaration, symbol, options);
        } else if (ts.isTypeParameterDeclaration(declaration)) {
            apiItem = new ApiTypeParameter(declaration, symbol, options);
        } else if (ts.isTypeLiteralNode(declaration) || ts.isObjectLiteralExpression(declaration)) {
            apiItem = new ApiTypeLiteral(declaration, symbol, options);
        } else if (ts.isFunctionTypeNode(declaration) || ts.isArrowFunction(declaration) || ts.isFunctionExpression(declaration)) {
            apiItem = new ApiFunctionExpression(declaration, symbol, options);
        } else if (ts.isMappedTypeNode(declaration)) {
            apiItem = new ApiMapped(declaration, symbol, options);
        }

        // Filters declarations.
        if (apiItem != null &&
            options.ExtractorOptions.FilterApiItems != null &&
            !options.ExtractorOptions.FilterApiItems(apiItem)) {
            return undefined;
        }

        if (apiItem == null) {
            // This declaration is not supported, show a Warning message.
            LogWithNodePosition(
                LogLevel.Warning,
                declaration,
                `Declaration "${ts.SyntaxKind[declaration.kind]}" is not supported yet.`
            );
        }

        return apiItem;
    }

    export function ShouldVisit(declaration: ts.Declaration, options: ApiItemOptions): boolean {
        const declarationSourceFile = declaration.getSourceFile();
        const declarationFileName = declarationSourceFile.fileName;

        // External library.
        const externalLibraryName = TsHelpers.GetSourceFileExternalLibraryLocation(declarationSourceFile, options.Program, true);
        if (externalLibraryName != null) {
            // Check if PackageName is in external packages.
            return options.ExternalPackages.
                findIndex(x => x === externalLibraryName) !== -1;
        } else if (!PathIsInside(declarationFileName, options.ExtractorOptions.ProjectDirectory)) {
            // If it's not external package, it should be in project directory.
            return false;
        } else if (options.ExtractorOptions.Exclude != null) {
            // Exclude file name.
            const result = options.ExtractorOptions.Exclude
                .findIndex(excludeItem => {
                    const fullPath = path
                        .resolve(options.ExtractorOptions.ProjectDirectory, excludeItem)
                        .split(path.sep)
                        .join(options.ExtractorOptions.OutputPathSeparator);

                    return fullPath === declarationFileName;
                });

            return result === -1;
        }

        return true;
    }

    export function GetItemId(declaration: ts.Declaration, symbol: ts.Symbol, options: ApiItemOptions): string | undefined {
        if (!ShouldVisit(declaration, options)) {
            return undefined;
        }

        if (options.Registry.HasDeclaration(declaration)) {
            return options.Registry.GetDeclarationId(declaration);
        }

        const resolveRealSymbol = TsHelpers.FollowSymbolAliases(symbol, options.Program.getTypeChecker());
        const apiItem = VisitApiItem(declaration, resolveRealSymbol, options);
        if (apiItem == null) {
            return undefined;
        }

        return options.AddItemToRegistry(apiItem);
    }

    export function GetItemsIdsFromSymbolsMap(
        symbols: ts.UnderscoreEscapedMap<ts.Symbol> | undefined,
        options: ApiItemOptions
    ): ApiItemReference[] {
        const items: ApiItemReference[] = [];
        if (symbols == null) {
            return items;
        }

        symbols.forEach(symbol => {
            const referenceTuple = GetItemIdsFromSymbol(symbol, options);
            if (referenceTuple != null) {
                items.push(referenceTuple);
            }
        });

        return items;
    }

    export function GetItemIdsFromSymbol(symbol: ts.Symbol | undefined, options: ApiItemOptions): ApiItemReference | undefined {
        if (symbol == null || symbol.declarations == null) {
            return undefined;
        }
        const symbolItems: string[] = [];

        // Filter out the same namespace.
        const filteredDeclarations: ts.Declaration[] = [];
        for (const declaration of symbol.declarations) {
            if (filteredDeclarations.find(x => ts.isModuleDeclaration(x)) != null) {
                continue;
            }

            filteredDeclarations.push(declaration);
        }

        for (const declaration of filteredDeclarations) {
            const itemId = GetItemId(declaration, symbol, options);
            if (itemId != null) {
                symbolItems.push(itemId);
            }
        }

        // If symbol doesn't have resolved api definitions.
        if (symbolItems.length === 0) {
            return undefined;
        }

        return {
            Alias: symbol.name,
            Ids: symbolItems
        };
    }

    export function GetItemsIdsFromDeclarations(
        declarations: ts.NodeArray<ts.Declaration>,
        options: ApiItemOptions
    ): ApiItemReference[] {
        let items: ApiItemReference[] = [];
        const typeChecker = options.Program.getTypeChecker();

        declarations.forEach(declaration => {
            const symbol = TsHelpers.GetSymbolFromDeclaration(declaration, typeChecker);
            if (symbol == null) {
                return;
            }

            const itemId = GetItemId(declaration, symbol, options);
            if (itemId == null) {
                return;
            }

            const index = items.findIndex(x => x != null && x.Alias === symbol.name);

            if (index === -1) {
                items.push({
                    Alias: symbol.name,
                    Ids: [itemId]
                });
            } else {
                items[index].Ids.push(itemId);
            }
        });

        // If symbol doesn't have resolved api definitions.
        items = items.filter(x => x.Ids.length !== 0);

        return items;
    }

    export function ResolveAccessModifierFromModifiers(modifiers?: ts.NodeArray<ts.Modifier>): AccessModifier {
        let accessModifier = AccessModifier.Public;

        if (modifiers != null) {
            modifiers.forEach(modifier => {
                switch (modifier.kind) {
                    case ts.SyntaxKind.PublicKeyword: {
                        accessModifier = AccessModifier.Public;
                        return;
                    }
                    case ts.SyntaxKind.PrivateKeyword: {
                        accessModifier = AccessModifier.Private;
                        return;
                    }
                    case ts.SyntaxKind.ProtectedKeyword: {
                        accessModifier = AccessModifier.Protected;
                        return;
                    }
                }
            });
        }

        return accessModifier;
    }

    export function ModifierKindExistsInModifiers(modifiers: ts.NodeArray<ts.Modifier> | undefined, kind: ts.SyntaxKind): boolean {
        if (modifiers != null) {
            return modifiers.some(x => x.kind === kind);
        }

        return false;
    }

    export function LogWithNodePosition(logLevel: LogLevel, declaration: ts.Node, message: string): void {
        const sourceFile = declaration.getSourceFile();
        const position = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());
        const linePrefix = `${sourceFile.fileName}(${position.line + 1},${position.character + 1})`;
        Logger.Log(logLevel, `${linePrefix}: ${message}`);
    }

    export function LogWithLocation(logLevel: LogLevel, location: ApiItemLocationDto, message: string): void {
        const linePrefix = `${location.FileName}(${location.Line + 1},${location.Character + 1})`;
        Logger.Log(logLevel, `${linePrefix}: ${message}`);
    }

    export function StandardizeRelativePath(location: string, options: ApiItemOptions): string {
        const workingSep = options.ExtractorOptions.OutputPathSeparator;
        const fixedLocation = location.split(path.sep).join(workingSep);

        if ((path.isAbsolute(fixedLocation) && fixedLocation[0] !== workingSep) || fixedLocation[0] === ".") {
            return fixedLocation;
        }

        if (fixedLocation[0] === workingSep) {
            return `.${fixedLocation}`;
        }

        return `.${workingSep}${fixedLocation}`;
    }

    export function GetApiItemLocationDtoFromNode(node: ts.Node, options: ApiItemOptions): ApiItemLocationDto {
        const sourceFile = node.getSourceFile();

        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const fileNamePath = path.relative(options.ExtractorOptions.ProjectDirectory, sourceFile.fileName);
        let fileName = StandardizeRelativePath(fileNamePath, options);

        // Resolve package location if source file from external library.
        const externalPackagePath = TsHelpers.GetSourceFileExternalLibraryLocation(sourceFile, options.Program);
        const isExternalPackage = externalPackagePath != null;
        if (externalPackagePath != null) {
            fileName = externalPackagePath;
        }

        return {
            FileName: fileName,
            Line: position.line,
            Character: position.character,
            IsExternalPackage: isExternalPackage
        };
    }

    /**
     * Get parent reference id from declaration.
     */
    export function GetParentIdFromDeclaration(declaration: ts.Declaration, options: ApiItemOptions): string | undefined {
        const parentDeclaration = declaration.parent as ts.Declaration;
        if (parentDeclaration == null) {
            return undefined;
        }

        const parentSymbol = TsHelpers.GetSymbolFromDeclaration(parentDeclaration, options.Program.getTypeChecker());
        if (parentSymbol == null) {
            return undefined;
        }

        return ApiHelpers.GetItemId(parentDeclaration, parentSymbol, options);
    }
}
