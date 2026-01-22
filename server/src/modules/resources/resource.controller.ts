import { Response, NextFunction } from 'express';
import { ResourceService } from './resource.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class ResourceController {
    private service: ResourceService;

    constructor() {
        this.service = new ResourceService();
    }

    getResources = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const resources = await this.service.getAllResources(userId);
            res.json({ success: true, data: resources });
        } catch (error) {
            next(error);
        }
    };

    getResourceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: 'Resource ID is required' });
            }

            const resource = await this.service.getResourceById(id, userId);
            res.json({ success: true, data: resource });
        } catch (error) {
            next(error);
        }
    };

    createResource = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const resource = await this.service.createResource(userId, req.body);
            res.status(201).json({ success: true, data: resource });
        } catch (error) {
            next(error);
        }
    };

    updateResource = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: 'Resource ID is required' });
            }

            const resource = await this.service.updateResource(id, userId, req.body);
            res.json({ success: true, data: resource });
        } catch (error) {
            next(error);
        }
    };

    deleteResource = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: 'Resource ID is required' });
            }

            const result = await this.service.deleteResource(id, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}
