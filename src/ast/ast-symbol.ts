import * as ts from "typescript";
import { AstItemBase } from "../abstractions/api-item-base";
import { AstItemBaseDto, AstItemMemberReference, AstItemKind } from "../contracts/ast-item";

export interface AstSymbolDto extends AstItemBaseDto {
    members: AstItemMemberReference[];
}

export class AstSymbol extends AstItemBase<AstSymbolDto, ts.Symbol> {
    public get itemKind(): AstItemKind {
        return AstItemKind.Symbol;
    }

    public get itemId(): string {
        return `${this.parentId}.${this.name}`;
    }

    public get name(): string {
        return this.item.name;
    }

    protected onExtract(): AstSymbolDto {
        return {
            name: this.name,
            members: this.membersReferences || []
        };
    }

    protected onGatherMembers(): AstItemMemberReference[] {
        return [];
    }
}