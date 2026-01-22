import { ResourceRepository } from './resource.repository';
import { type NewResource } from '../../db/schema';
import crypto from 'crypto';

export class ResourceService {
    private repository: ResourceRepository;

    constructor() {
        this.repository = new ResourceRepository();
    }

    async getAllResources(ownerId: string) {
        return await this.repository.findAll(ownerId);
    }

    async getResourceById(id: string, ownerId: string) {
        const resource = await this.repository.findById(id, ownerId);
        if (!resource) {
            throw new Error('Resource not found');
        }
        return resource;
    }

    async createResource(ownerId: string, data: Omit<NewResource, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
        const newResource: NewResource = {
            id: crypto.randomBytes(16).toString('hex'),
            ownerId,
            name: data.name,
            type: data.type,
            capacity: data.capacity || 1,
            email: data.email || null,
        };

        return await this.repository.create(newResource);
    }

    async updateResource(id: string, ownerId: string, data: Partial<Omit<NewResource, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) {
        const resource = await this.repository.update(id, ownerId, data);
        if (!resource) {
            throw new Error('Resource not found');
        }
        return resource;
    }

    async deleteResource(id: string, ownerId: string) {
        const deleted = await this.repository.delete(id, ownerId);
        if (!deleted) {
            throw new Error('Resource not found');
        }
        return { success: true, message: 'Resource deleted successfully' };
    }
}
