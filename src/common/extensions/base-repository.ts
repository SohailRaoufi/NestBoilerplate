import 'dotenv/config';
import {
  AutoPath,
  Collection,
  EntityManager,
  EntityName,
  EntityRepository,
  ExpandProperty,
  FilterQuery,
  FindOptions,
  IWrappedEntity,
  Loaded,
  PopulatePath,
  Reference,
} from '@mikro-orm/postgresql';

import {
  FilterOperator,
  transformFilterQueryParams,
  sanitizeFilterQuery,
  mergeFilterOperators,
  unFlattenObject,
  sanitizeSortObject,
  mergeSortObjects,
} from '@/utils/pagination';

/**
 * Type keys that belong to the wrapped entity properties (like `__helper`).
 */
type WrappedEntityKeys = keyof IWrappedEntity<any>;

/**
 * Defines allowable filter structure.
 * For each field:
 * - If it's a Date, we can apply FilterOperators (like $eq, $gt, etc.)
 * - If it's an object, recursively define filterability.
 * - Otherwise, apply standard FilterOperators.
 */
export type Filterable<Entity> = {
  [Field in Exclude<
    keyof Entity,
    WrappedEntityKeys
  >]?: Entity[Field] extends Date
    ? FilterOperator | FilterOperator[]
    : Entity[Field] extends object
      ? Filterable<ExpandProperty<Entity[Field]>>
      : FilterOperator | FilterOperator[];
};

/**
 * Extracts the keys of an entity that are not relations (Collection or Reference) and not objects.
 */
type NonRelationKeys<Entity> = {
  [K in keyof Entity]: Entity[K] extends
    | Collection<any, any>
    | Reference<any>
    | object
    ? never
    : K;
}[keyof Entity];

/**
 * A list of entity fields that can be searched. This includes primitive fields and possibly expanded properties.
 */
export type Searchable<Entity> = Array<
  Exclude<NonRelationKeys<Entity>, WrappedEntityKeys> | ExpandProperty<Entity>
>;

/**
 * Defines additional options for filtering, searching, and sorting.
 */
export type FilterOptions<Entity, Fields extends string | boolean> = {
  filterable?: Filterable<Entity>;
  searchable?: Searchable<Entity>;
  sortable?: AutoPath<Entity, Fields, `${PopulatePath.ALL}`>[];
};

/**
 * Client pagination query parameters.
 */
export type PaginateQuery = {
  page?: number;
  itemsPerPage?: number;
  filter?: Record<string, any>;
  search?: string;
  sort?: Record<string, any>;
};

/**
 * Metadata returned along with paginated data.
 */
export type Meta = {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  filters?: Record<string, any>;
  sorts?: Record<string, any>;
  search?: string;
};

/**
 * BaseRepository
 * --------------
 * Extends MikroORM's EntityRepository to provide a standard method for
 * pagination, filtering, searching, and sorting.
 *
 * Usage:
 *   const [results, meta] = await this.findAndPaginate({ isActive: true }, {}, {
 *     filterable: { name: ['$eq', '$ilike'], createdAt: ['$gte', '$lte'] },
 *     searchable: ['name', 'description'],
 *     sortable: ['name', 'createdAt']
 *   }, { page: 2, itemsPerPage: 10, search: 'foo', sort: { 'createdAt': 'desc' } });
 */
export class BaseRepository<
  Entity extends object,
> extends EntityRepository<Entity> {
  constructor(em: EntityManager, entityName: EntityName<Entity>) {
    super(em, entityName);
  }

  /**
   * Find and paginate entities based on complex query parameters including filters, search strings,
   * and sorting criteria. Returns both the data and pagination metadata.
   *
   * @param where - Base conditions.
   * @param options - FindOptions passed directly to MikroORM.
   * @param filterOptions - Configuration defining filterable, searchable, and sortable fields.
   * @param query - Client-provided pagination, search, and sort parameters.
   * @returns A tuple with [data, meta].
   */
  async findAndPaginate<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(
    where?: FilterQuery<Entity>,
    options?: Omit<
      FindOptions<Entity, Hint, Fields, Excludes>,
      'offset' | 'limit'
    >,
    filterOptions?: FilterOptions<Entity, Fields>,
    query?: PaginateQuery,
  ): Promise<[Loaded<Entity, Hint, Fields, Excludes>[], Meta]> {
    const { orderBy, ...findOptions } = options || {};

    // Extract pagination parameters with defaults
    const {
      page = 1,
      itemsPerPage = 10,
      filter = {},
      sort = { createdAt: 'ASC' },
      search,
    } = query || {};

    const currentPage = Math.max(1, Number(page));
    const limit = Math.min(Math.max(1, Number(itemsPerPage)), 100);
    const offset = (currentPage - 1) * limit;

    // Transform and sanitize filters
    const filterQuery = transformFilterQueryParams(filter);
    const sanitizedFilterQuery = sanitizeFilterQuery(
      filterOptions?.filterable ?? {},
      filterQuery,
    );
    const mergedFilterQuery = mergeFilterOperators(
      where as Record<string, any>,
      sanitizedFilterQuery,
    );

    // Handle search if applicable
    if (filterOptions?.searchable && search) {
      const searchConditions = filterOptions.searchable.map((field) =>
        unFlattenObject({ [field as any]: { $ilike: `%${search}%` } }),
      );

      mergedFilterQuery.$or = [
        ...(mergedFilterQuery.$or || []),
        ...searchConditions,
      ];
    }

    // Sanitize and merge sorting parameters
    const sortQuery = unFlattenObject(sort);
    const sanitizedSortQuery = sanitizeSortObject(
      sortQuery,
      filterOptions?.sortable ?? [],
    );
    const mergedSortQuery = mergeSortObjects(
      orderBy ?? {},
      sanitizedSortQuery,
    ) as any;

    // Query the database
    const [data, count] = await this.findAndCount(
      mergedFilterQuery as FilterQuery<Entity>,
      {
        offset,
        limit,
        orderBy: mergedSortQuery,
        ...findOptions,
      },
    );

    // Construct pagination metadata
    const meta: Meta = {
      currentPage,
      itemsPerPage: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      filters: sanitizedFilterQuery,
      sorts: sanitizedSortQuery,
      search,
    };

    return [data, meta];
  }
}
