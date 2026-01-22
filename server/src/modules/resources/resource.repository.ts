import { db } from '../../db';
import { resources, type Resource, type NewResource } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class ResourceRepository {
    async findAll(ownerId: string): Promise<Resource[]> {
        return await db.query.resources.findMany({
            where: eq(resources.ownerId, ownerId),
            orderBy: (resources, { asc }) => [asc(resources.createdAt)],
        });
    }

    async findById(id: string, ownerId: string): Promise<Resource | undefined> {
        return await db.query.resources.findFirst({
            where: and(
                eq(resources.id, id),
                eq(resources.ownerId, ownerId)
            ),
        });
    }

    async create(data: NewResource): Promise<Resource> {
        const [resource] = await db.insert(resources).values(data).returning();
        return resource;
    }

    async update(id: string, ownerId: string, data: Partial<NewResource>): Promise<Resource | undefined> {
        const [updated] = await db
            .update(resources)
            .set({ ...data, updatedAt: new Date() })
            .where(and(
                eq(resources.id, id),
                eq(resources.ownerId, ownerId)
            ))
            .returning();
        return updated;
    }

    async delete(id: string, ownerId: string): Promise<boolean> {
        const result = await db
            .delete(resources)
            .where(and(
                eq(resources.id, id),
                eq(resources.ownerId, ownerId)
            ))
            .returning();
        return result.length > 0;
    }
}
