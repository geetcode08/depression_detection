from typing import Dict, List

from schemas.dashboard import RecommendationItem

# Curated recommendation pools by risk_label
_RECOMMENDATIONS: Dict[str, List[RecommendationItem]] = {
    "low": [
        RecommendationItem(
            category="activity",
            title="Take a 10-minute walk",
            description="A short walk outdoors can boost your mood and energy levels. Try to notice the sights and sounds around you.",
            priority=1,
        ),
        RecommendationItem(
            category="social",
            title="Reach out to a friend",
            description="Send a message or call someone you care about. Social connection is one of the strongest mood boosters.",
            priority=2,
        ),
        RecommendationItem(
            category="activity",
            title="Listen to uplifting music",
            description="Put on your favorite playlist or discover new music. Music can significantly improve your emotional state.",
            priority=3,
        ),
        RecommendationItem(
            category="breathing",
            title="Try 5 minutes of deep breathing",
            description="Breathe in for 4 counts, hold for 4, exhale for 6. This activates your body's relaxation response.",
            priority=4,
        ),
        RecommendationItem(
            category="activity",
            title="Do something creative",
            description="Draw, write, cook, or build something. Creative activities help express emotions and build a sense of accomplishment.",
            priority=5,
        ),
    ],
    "medium": [
        RecommendationItem(
            category="journaling",
            title="Write in a gratitude journal",
            description="Write down 3 things you're grateful for today. Research shows this practice can meaningfully improve mood over time.",
            priority=1,
        ),
        RecommendationItem(
            category="activity",
            title="Take a 20-minute walk in nature",
            description="Spending time in green spaces has been shown to reduce stress hormones and improve well-being.",
            priority=2,
        ),
        RecommendationItem(
            category="breathing",
            title="Practice box breathing",
            description="Inhale 4 counts, hold 4, exhale 4, hold 4. Repeat for 5 minutes. This helps regulate your nervous system.",
            priority=3,
        ),
        RecommendationItem(
            category="journaling",
            title="Reflect on your feelings",
            description="Write freely about how you're feeling without judgment. Getting thoughts on paper can help process emotions.",
            priority=4,
        ),
        RecommendationItem(
            category="social",
            title="Talk to someone you trust",
            description="Share how you're feeling with a friend, family member, or someone you trust. You don't have to go through this alone.",
            priority=5,
        ),
        RecommendationItem(
            category="activity",
            title="Try gentle stretching or yoga",
            description="Even 10 minutes of gentle movement can help release tension and improve your mood.",
            priority=6,
        ),
        RecommendationItem(
            category="activity",
            title="Establish a sleep routine",
            description="Try going to bed and waking up at the same time. Good sleep is foundational to emotional well-being.",
            priority=7,
        ),
    ],
    "high": [
        RecommendationItem(
            category="professional_help",
            title="Consider talking to a professional",
            description="A counselor or therapist can provide specialized support. You deserve professional care. iCall: 9152987821, Vandrevala Foundation: 1860-2662-345.",
            priority=1,
        ),
        RecommendationItem(
            category="social",
            title="Reach out to someone you trust right now",
            description="Please don't go through this alone. Talk to a family member, friend, teacher, or anyone you feel safe with.",
            priority=2,
        ),
        RecommendationItem(
            category="breathing",
            title="Ground yourself with 5-4-3-2-1",
            description="Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste. This grounding technique can help in difficult moments.",
            priority=3,
        ),
        RecommendationItem(
            category="activity",
            title="Step outside for fresh air",
            description="Even stepping outside your door for a few minutes can help shift your perspective. You don't need to go far.",
            priority=4,
        ),
        RecommendationItem(
            category="journaling",
            title="Write down your thoughts",
            description="Put your feelings into words, even if they feel messy. Writing can help you process overwhelming emotions.",
            priority=5,
        ),
    ],
}


def get_recommendations(risk_label: str) -> List[RecommendationItem]:
    label = risk_label.lower()
    if label not in _RECOMMENDATIONS:
        label = "low"
    return _RECOMMENDATIONS[label]
