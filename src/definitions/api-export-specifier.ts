import * as ts from "typescript";
import { LogLevel } from "simplr-logger";

import { ApiItem } from "../abstractions/api-item";
import { ApiHelpers } from "../api-helpers";
import { ApiDefinitionKind, ApiExportSpecifierDto, ApiExportSpecifierApiItems } from "../contracts/api-definitions";
import { ApiMetadataDto } from "../contracts/api-metadata-dto";
import { ApiItemLocationDto } from "../contracts/api-item-location-dto";

export class ApiExportSpecifier extends ApiItem<ts.ExportSpecifier, ApiExportSpecifierDto> {
    private location: ApiItemLocationDto;
    private apiItems: ApiExportSpecifierApiItems;

    protected OnGatherData(): void {
        // ApiItemLocation
        this.location = ApiHelpers.GetApiItemLocationDtoFromNode(this.Declaration, this.Options);

        const targetSymbol = this.TypeChecker.getExportSpecifierLocalTargetSymbol(this.Declaration);
        const symbolReferences = ApiHelpers.GetItemIdsFromSymbol(targetSymbol, this.Options);

        if (symbolReferences != null) {
            this.apiItems = symbolReferences.Ids;
        } else {
            ApiHelpers.LogWithNodePosition(LogLevel.Warning, this.Declaration, "Exported item does not exist.");
        }
    }

    public OnExtract(): ApiExportSpecifierDto {
        const parentId: string | undefined = ApiHelpers.GetParentIdFromDeclaration(this.Declaration, this.Options);
        const metadata: ApiMetadataDto = this.GetItemMetadata();

        return {
            ApiKind: ApiDefinitionKind.ExportSpecifier,
            Name: this.Declaration.name.getText(),
            ParentId: parentId,
            Metadata: metadata,
            Location: this.location,
            ApiItems: this.apiItems,
            _ts: this.GetTsDebugInfo()
        };
    }
}
