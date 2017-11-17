import { ApiBaseItemDto } from "../api-base-item-dto";
import { AccessModifier } from "../access-modifier";
import { ApiItemReferenceTuple } from "../api-item-reference-tuple";
import { ApiItemKinds } from "../api-item-kinds";

export interface ApiClassConstructorDto extends ApiBaseItemDto {
    ApiKind: ApiItemKinds.ClassConstructor;
    Parameters: ApiItemReferenceTuple;
    AccessModifier: AccessModifier;
}
