import { Router } from 'express';
import { PlanService } from '../services/plan-service';

const router = Router();
const planService = new PlanService();

// List all plans
router.get('/', async (req, res) => {
  try {
    const plans = await planService.listPlans();
    res.json(plans);
  } catch (err) {
    console.error('Error listing plans:', err);
    res.status(500).json({ error: 'Failed to list plans' });
  }
});

// Get single plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await planService.getPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(plan);
  } catch (err) {
    console.error('Error getting plan:', err);
    res.status(500).json({ error: 'Failed to get plan' });
  }
});

// Refresh plans (trigger re-scan)
router.post('/refresh', async (req, res) => {
  try {
    const plans = await planService.listPlans();
    res.json({ count: plans.length });
  } catch (err) {
    console.error('Error refreshing plans:', err);
    res.status(500).json({ error: 'Failed to refresh plans' });
  }
});

export { router as plansRouter };
