import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';

/**
 * All fields optional. Used by PATCH /api/listings/:id
 * to update a listing in DRAFT or NEEDS_CHANGES status.
 */
export class UpdateListingDto extends PartialType(CreateListingDto) {}
