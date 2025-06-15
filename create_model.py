from sklearn.ensemble import RandomForestClassifier
import joblib
import numpy as np

# Dummy model for initial setup
clf = RandomForestClassifier()
clf.fit(np.random.rand(100, 3), np.random.randint(0, 3, 100))
joblib.dump(clf, 'document_classifier.pkl')

print("Dummy classifier model created and saved as 'document_classifier.pkl'") 