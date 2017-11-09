import * as ts from "typescript";
import { ApiItem, ApiItemOptions } from "../abstractions/api-item";

import { TSHelpers } from "../ts-helpers";
import { ApiHelpers } from "../api-helpers";
import { ApiClassConstructorDto } from "../contracts/definitions/api-class-constructor-dto";
import { ApiItemReferenceDictionary } from "../contracts/api-item-reference-dictionary";
import { ApiItemKinds } from "../contracts/api-item-kinds";
import { AccessModifier } from "../contracts/access-modifier";
import { TypeDto } from "../contracts/type-dto";

import { ApiParameter } from "./api-parameter";
import { ApiMetadataDto } from "../contracts/api-metadata-dto";

export class ApiClassConstructor extends ApiItem<ts.ConstructorDeclaration, ApiClassConstructorDto> {
    private parameters: ApiItemReferenceDictionary = {};
    private accessModifier: AccessModifier;

    protected OnGatherData(): void {
        this.parameters = ApiHelpers.GetItemsIdsFromDeclarations(this.Declaration.parameters, this.Options);

        // Modifiers
        this.accessModifier = ApiHelpers.ResolveAccessModifierFromModifiers(this.Declaration.modifiers);
    }

    public OnExtract(): ApiClassConstructorDto {
        const metadata: ApiMetadataDto = this.GetItemMetadata();

        return {
            ApiKind: ApiItemKinds.ClassMethod,
            Name: this.Symbol.name,
            Kind: this.Declaration.kind,
            KindString: ts.SyntaxKind[this.Declaration.kind],
            Metadata: metadata,
            Parameters: this.parameters,
            AccessModifier: this.accessModifier
        };
    }
}
